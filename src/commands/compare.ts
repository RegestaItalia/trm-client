import { View } from "trm-registry-types";
import { ActionArguments, CompareArguments } from "./arguments";
import * as fs from "fs";
import { Inquirer, Logger, SystemConnector, TrmManifest } from "trm-core";
import { SystemAlias } from "../systemAlias";
import { connect } from "./prompts";
import { viewRegistryPackage } from "./commons";

const _promptConnections = async (inquirer: Inquirer, logger: Logger, aConnections: SystemConnector[]) => {
    if (aConnections.length > 0) {
        logger.info(`Compare systems: ${aConnections.map(o => o.getDest()).join(', ')}`);
    }
    var askConnection = true;
    const inq1 = await inquirer.prompt([{
        message: "Add another connection?",
        name: "continue",
        type: "confirm",
        default: true,
        when: aConnections.length > 0
    }]);
    askConnection = inq1.continue !== undefined ? inq1.continue : askConnection;
    if (askConnection) {
        const connectArgs = await connect({}, {
            inquirer
        }, false);
        const oConnection = new SystemConnector({
            ashost: connectArgs.ashost,
            dest: connectArgs.dest,
            sysnr: connectArgs.sysnr,
            saprouter: connectArgs.saprouter
        }, {
            client: connectArgs.client,
            lang: connectArgs.lang,
            user: connectArgs.user,
            passwd: connectArgs.passwd
        }, logger);
        if (!aConnections.find(o => o.address === oConnection.address)) {
            await oConnection.connect(false);
            aConnections.push(oConnection);
        }
    }
    return {
        continue: askConnection,
        connections: aConnections
    }
}

export async function compare(commandArgs: CompareArguments, actionArgs: ActionArguments) {
    const inquirer = actionArgs.inquirer;
    const registry = actionArgs.registry;
    const logger = actionArgs.logger;

    const packageName = commandArgs.package;

    var inputConnections = commandArgs.connections;
    var aConnections: SystemConnector[] = [];
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
            const oAlias = SystemAlias.get(sAlias, logger);
            if (!oAlias) {
                throw new Error(`Connection alias "${sAlias}" not found.`);
            }
            const oConnection = oAlias.getConnection();
            if (!aConnections.find(o => o.address === oConnection.address)) {
                await oConnection.connect(false);
                aConnections.push(oConnection);
            }
        }
    }
    if (aConnections.length === 0) {
        var keepPrompt = true;
        while (keepPrompt) {
            const oPromptRes = await _promptConnections(inquirer, logger, aConnections);
            keepPrompt = oPromptRes.continue;
            aConnections = oPromptRes.connections;
        }
    }

    
    logger.info(`Compare systems: ${aConnections.map(o => o.getDest()).join(', ')}`);

    const tableHead = [`System`, `Installed`, `Version`, `Devclass`, `Transport request`, `Dependencies check`, `SAP Entries check`];
    var tableData = [];

    logger.loading(`Reading registry data...`);
    var oRegistryView: View;
    try{
        oRegistryView = await viewRegistryPackage(registry, packageName, logger);
    }catch(e){ }

    logger.loading(`Reading system data...`);
    var connectionData = [];
    var oSystemViewManifest: TrmManifest;
    var devclass: String;
    for (const oConnection of aConnections) {
        connectionData = [];
        oSystemViewManifest = null;
        devclass = null;
        const aSystemPackages = await oConnection.getInstalledPackages(false);
        const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(registry));
        try {
            oSystemViewManifest = oSystemView.manifest.get(true);
        } catch (e) { }
        connectionData.push(oConnection.getDest());
        connectionData.push(oSystemViewManifest ? `Yes` : `No`);
        connectionData.push(oSystemViewManifest ? oSystemViewManifest.version : '');
        if(!oSystemView.getDevclass() && oSystemViewManifest && oSystemViewManifest.linkedTransport){
            devclass = await oSystemViewManifest.linkedTransport.getDevclass();
        }else{
            devclass = oSystemView.getDevclass();
        }
        connectionData.push(devclass || '');
        if(oSystemViewManifest && oSystemViewManifest.linkedTransport){
            connectionData.push(oSystemViewManifest.linkedTransport.trkorr);
        }else{
            connectionData.push('');
        }
        if(oSystemViewManifest){
            //const dependenciesCheckResult = await checkDependencies()
            /*const sapEntriesCheckResult = await checkSapEntries(oSystemViewManifest.sapEntries || {}, oConnection);
            connectionData.push('Passed');
            connectionData.push(sapEntriesCheckResult.missingSapEntries.length === 0 ? 'Passed' : 'Failed');*/
            connectionData.push('');
            connectionData.push('');
        }else{
            connectionData.push('');
            connectionData.push('');
        }
        tableData.push(connectionData);
    }


    logger.info(`Package name: ${packageName}`);
    logger.info(`Registry: ${registry.name}`);
    try {
        logger.info(`Latest version: ${oRegistryView.release.version}`);
    } catch (e) {
        logger.warning(`Latest version: Unknown`);
    }
    logger.log(` `);
    logger.table(tableHead, tableData);
}