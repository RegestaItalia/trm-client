import { Package } from "trm-registry-types";
import { CompareArguments } from "./arguments";
import * as fs from "fs";
import { SystemAlias } from "../systemAlias";
import { connect } from "./prompts";
import { CommandContext, viewRegistryPackage } from "./commons";
import { ISystemConnector, SystemConnector } from "trm-core";
import { Inquirer, Logger } from "trm-commons";

const _promptConnections = async (aConnections: ISystemConnector[]): Promise<{ continue: boolean, connections: ISystemConnector[] }> => {
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
        const connectArgs = await connect({}, false, false);
        const systemConnector = connectArgs.getSystemConnector() as ISystemConnector;
        await systemConnector.connect();
        aConnections.push(systemConnector);
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
        for (const sAlias of aInputConnections) {
            const oAlias = SystemAlias.get(sAlias);
            const oConnection = oAlias.getConnection();
            aConnections.push(oConnection);
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
    var oRegistryView: Package;
    try {
        oRegistryView = await viewRegistryPackage(packageName, true);
    } catch (e) { }

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
        if (oSystemView && oSystemView.manifest) {
            installed = 'Yes';
            version = oSystemView.manifest.get().version || 'Unknown';
            devclass = oSystemView.getDevclass() || 'Unknown';
            if (oSystemView.manifest.getLinkedTransport()) {
                importTransport = oSystemView.manifest.getLinkedTransport().trkorr;
            } else {
                importTransport = 'Unknown';
            }
        } else {
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
        Logger.info(`Latest version: ${oRegistryView.dist_tags['latest'] || 'unknown'}`);
    } catch (e) {
        Logger.warning(`Latest version: Unknown`);
    }
    Logger.log(`\n`);
    Logger.table(tableHead, tableData);
}