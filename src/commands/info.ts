import { getNpmGlobalPath, Logger, PUBLIC_RESERVED_KEYWORD, Registry, SystemConnector, TreeLog } from "trm-core";
import { getClientDependencies, getClientVersion, getTrmDependencies } from "../utils";
import { InfoArguments } from "./arguments";
import { CommandContext } from "./commons";
import { readFileSync } from "fs";
import path from "path";
import { rootPath } from 'get-root-path';
import chalk from "chalk";

const _getDependencyVersion = (moduleName: string) => {
    var file: Buffer;
    try{
        file = readFileSync(path.join(rootPath, `/node_modules/trm-client/node_modules/${moduleName}/package.json`));
    }catch(e){
        file = readFileSync(path.join(rootPath, `/node_modules/${moduleName}/package.json`));
    }
    if(!file){
        Logger.warning(`Library ${moduleName} was not found!`, true);
    }else{
        return JSON.parse(file.toString()).version;
    }
}

const _getNodeRfcVersion = (npmGlobal: string) => {
    var file: Buffer;
    try{
        file = readFileSync(path.join(npmGlobal, `/node-rfc/package.json`));
    }catch(e){
        //
    }
    if(!file){
        Logger.warning(`Library node-rfc was not found!`, true);
    }else{
        return JSON.parse(file.toString()).version;
    }
}

export async function info(commandArgs: InfoArguments) {
    const npmGlobal = await getNpmGlobalPath();

    const clientVersion = getClientVersion();
    const clientDependencies = getClientDependencies() || {};
    const trmDependencies = getTrmDependencies() || {};
    const trmDependenciesInstances = CommandContext.trmDependencies;
    const nodeRfcVersion = _getNodeRfcVersion(npmGlobal);
    const trmRest = CommandContext.systemPackages.find(o => o.compareName("trm-rest") && o.compareRegistry(new Registry(PUBLIC_RESERVED_KEYWORD)));

    var clientDependenciesTree: TreeLog[] = [];
    if(clientDependencies){
        Object.keys(clientDependencies).filter(d => d.startsWith('trm')).forEach(d => {
            var installedVersion = _getDependencyVersion(d);
            if(installedVersion){
                installedVersion = ` -> ${installedVersion}`;
            }else{
                installedVersion = ``;
            }
            clientDependenciesTree.push({
                text: `${d} ${clientDependencies[d]}${installedVersion}`,
                children: []
            });
        });
    }

    var serverDependenciesTree: TreeLog[] = [];
    if(trmDependencies){
        Object.keys(trmDependencies).forEach(d => {
            const oTrmPackage = trmDependenciesInstances.find(o => o.compareName(d));
            var installedVersion;
            try{
                installedVersion = oTrmPackage.manifest.get().version;
            }catch(e){
                //
            }
            if(installedVersion){
                installedVersion = ` -> ${installedVersion}`;
            }else{
                installedVersion = ``;
            }
            serverDependenciesTree.push({
                text: `${d} ${trmDependencies[d]}${installedVersion}`,
                children: []
            });
        });
    }
    if(trmRest && trmRest.manifest){
        serverDependenciesTree.push({
            text: `trm-rest -> ${trmRest.manifest.get().version}`,
            children: []
        });
    }

    var clientChildrenTree: TreeLog[] = [{
        text: `trm-client ${clientVersion}`,
        children: clientDependenciesTree
    }];
    if(nodeRfcVersion){
        clientChildrenTree.push({
            text: `node-rfc ${nodeRfcVersion}`,
            children: []
        });
    }
    const clientTree: TreeLog = {
        text: chalk.bold(`Client`),
        children: clientChildrenTree
    };
    Logger.tree(clientTree);

    const serverTree: TreeLog = {
        text: chalk.bold(`Server (${SystemConnector.getDest()})`),
        children: serverDependenciesTree
    };
    Logger.tree(serverTree);
}