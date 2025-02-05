import { View } from "trm-registry-types";
import { CompareArguments } from "./arguments";
import * as fs from "fs";
import { SystemAlias } from "../systemAlias";
import { connect } from "./prompts";
import { CommandContext, viewRegistryPackage } from "./commons";
import { Inquirer, ISystemConnector, Logger, RESTConnection, RFCConnection, SystemConnector } from "trm-core";
import { getSystemConnector, SystemConnectorType } from "../utils";

const _compareConnectionData = (a: RESTConnection | RFCConnection, b: RESTConnection | RFCConnection): boolean => {
    /*return a.dest === b.dest &&
           a.ashost === b.ashost &&
           a.sysnr === b.sysnr &&
           a.saprouter === b.saprouter;*/
    //TODO FIX compare
    return false;
}

const _promptConnections = async (aConnections: ISystemConnector[]) => {
    if (aConnections.length > 0) {
        Logger.info(`Compare systems: ${aConnections.map(o => o.getDest()).join(', ')}`);
    }
    var askConnection = true;
    const inq1 = await Inquirer.prompt([{
        message: "Add another connection?",
        name: "continue",
        type: "confirm",
        default: true,
        when: aConnections.length > 0
    }]);
    askConnection = inq1.continue !== undefined ? inq1.continue : askConnection;
    if (askConnection) {
        const connectArgs = await connect({}, false);
        var oConnection: ISystemConnector;
        if(connectArgs.type === SystemConnectorType.RFC){
            oConnection = getSystemConnector(connectArgs.type, {
                connection: {
                    ashost: connectArgs.ashost,
                    dest: connectArgs.dest,
                    sysnr: connectArgs.sysnr,
                    saprouter: connectArgs.saprouter
                },
                login: {
                    user: connectArgs.user,
                    passwd: connectArgs.passwd,
                    lang: connectArgs.lang,
                    client: connectArgs.client
                }
            });
        }else if(connectArgs.type === SystemConnectorType.REST){
            oConnection = getSystemConnector(connectArgs.type, {
                connection: {
                    endpoint: connectArgs.endpoint,
                    rfcdest: connectArgs.forwardRfcDest
                },
                login: {
                    user: connectArgs.user,
                    passwd: connectArgs.passwd,
                    lang: connectArgs.lang,
                    client: connectArgs.client
                }
            });
        }
        if(oConnection){
            if (!aConnections.find(o => _compareConnectionData(o.getConnectionData(), oConnection.getConnectionData()))) {
                await oConnection.connect();
                aConnections.push(oConnection);
            }
        }
    }
    return {
        continue: askConnection,
        connections: aConnections
    }
}

export async function compare(commandArgs: CompareArguments) {
    const packageName = commandArgs.package;
    const registry = CommandContext.getRegistry();

    var inputConnections = commandArgs.connections;
    var aConnections: ISystemConnector[] = [];
    if (inputConnections) {
        //this could be the json file path or the json itself
        inputConnections = inputConnections.trim();
        var sInputConnections;
        var aInputConnections;
        if (inputConnections[0] === '[') {
            sInputConnections = inputConnections;
        } else {
            aInputConnections = fs.readFileSync(inputConnections);
        }
        try {
            aInputConnections = JSON.parse(sInputConnections);
        } catch (e) {
            throw new Error('Input connections: invalid JSON format.');
        }
        for(const sAlias of aInputConnections){
            const oAlias = SystemAlias.get(sAlias);
            const oConnection = oAlias.getConnection();
            if (!aConnections.find(o => _compareConnectionData(o.getConnectionData(), oConnection.getConnectionData()))) {
                await oConnection.connect();
                aConnections.push(oConnection);
            }
        }
    }
    if (aConnections.length === 0) {
        var keepPrompt = true;
        while (keepPrompt) {
            const oPromptRes = await _promptConnections(aConnections);
            keepPrompt = oPromptRes.continue;
            aConnections = oPromptRes.connections;
        }
    }
    
    Logger.info(`Compare systems: ${aConnections.map(o => o.getDest()).join(', ')}`);

    const tableHead = [`System`, `Installed`, `Version`, `Devclass`, `Import transport`];
    var tableData = [];

    Logger.loading(`Reading registry data...`);
    var oRegistryView: View;
    try{
        oRegistryView = await viewRegistryPackage(packageName, true);
    }catch(e){ }

    Logger.loading(`Reading system data...`);

    for (const oConnection of aConnections) {
        SystemConnector.systemConnector = oConnection;
        const system = SystemConnector.getDest() || '';
        var installed;
        var version;
        var devclass;
        var importTransport;
        const aSystemPackages = await SystemConnector.getInstalledPackages(true);
        const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(registry));
        if(oSystemView && oSystemView.manifest){
            installed = 'Yes';
            version = oSystemView.manifest.get().version || 'Unknown';
            devclass = oSystemView.getDevclass() || 'Unknown';
            if(oSystemView.manifest.getLinkedTransport()){
                importTransport = oSystemView.manifest.getLinkedTransport().trkorr;
            }else{
                importTransport = 'Unknown';
            }
        }else{
            installed = 'No';
            version = '';
            devclass = '';
            importTransport = '';
        }
        tableData.push([
            system,
            installed,
            version,
            devclass,
            importTransport
        ]);
    }

    Logger.info(`Package name: ${packageName}`);
    Logger.info(`Registry: ${registry.name}`);
    try {
        Logger.info(`Latest version: ${oRegistryView.release.version}`);
    } catch (e) {
        Logger.warning(`Latest version: Unknown`);
    }
    Logger.log(`\n`);
    Logger.table(tableHead, tableData);
}