import { getNpmGlobalPath, Logger, PUBLIC_RESERVED_KEYWORD, Registry, SystemConnector, TreeLog } from "trm-core";
import { checkCliUpdate, getClientDependencies, getClientVersion, getTrmDependencies, NoConnection } from "../utils";
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
    Logger.loading(`Reading data...`);

    const npmGlobal = await getNpmGlobalPath();
    const clientLatest = await checkCliUpdate(false);
    const clientVersion = getClientVersion();
    const clientDependencies = getClientDependencies() || {};
    const trmDependencies = getTrmDependencies() || {};
    const trmDependenciesInstances = CommandContext.trmDependencies;
    const trmMissingDependencies = CommandContext.missingTrmDependencies;
    const nodeRfcVersion = _getNodeRfcVersion(npmGlobal);
    const packages = await CommandContext.getSystemPackages();
    const trmRest = packages.find(o => o.compareName("trm-rest") && o.compareRegistry(new Registry(PUBLIC_RESERVED_KEYWORD)));

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
            var installedVersion = ``;
            const oTrmPackage = trmDependenciesInstances.find(o => o.compareName(d));
            if(oTrmPackage){
                try{
                    installedVersion = ` -> ${oTrmPackage.manifest.get().version}`;
                }catch(e){
                    installedVersion = ` -> ${e.message}`;
                }
            }else{
                const missingDependency = trmMissingDependencies.find(o => {
                    if(typeof(o) === 'string'){
                        if(o === d){
                            return o;
                        }
                    }else{
                        if(o.compareName(d)){
                            return o;
                        }
                    }
                });
                if(missingDependency){
                    try{
                        installedVersion = ` -> ${chalk.bgRed((missingDependency as any).manifest.get().version)}`;
                    }catch(e){
                        installedVersion = ` -> ${chalk.bgRed('Not found')}`;
                    }
                }
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

    //build client tree
    var clientChildrenTree: TreeLog[] = [{
        text: `trm-client ${clientVersion} ${clientLatest.newRelease ? chalk.bold('New release available') : chalk.bgGreen('LATEST')}`,
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

    //build server tree
    const serverTree: TreeLog = {
        text: chalk.bold(`Server (${SystemConnector.getDest()})`),
        children: serverDependenciesTree
    };
    if(!(SystemConnector.systemConnector instanceof NoConnection)){
        Logger.tree(serverTree);
    }
}