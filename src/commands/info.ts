import { Logger, SystemConnector, TreeLog } from "trm-core";
import { getClientDependencies, getClientVersion, getTrmDependencies } from "../utils";
import { InfoArguments } from "./arguments";
import { CommandContext } from "./commons";

export async function info(commandArgs: InfoArguments) {
    const clientVersion = getClientVersion();
    const clientDependencies = getClientDependencies() || {};
    const trmDependencies = getTrmDependencies() || {};
    const trmDependenciesInstances = CommandContext.trmDependencies;

    var clientDependenciesTree: TreeLog[] = [];
    if(clientDependencies){
        Object.keys(clientDependencies).filter(d => d.startsWith('trm')).forEach(d => {
            clientDependenciesTree.push({
                text: `${d} ${clientDependencies[d]}`,
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
                installedVersion = ` -> ${SystemConnector.getDest()} ${installedVersion}`;
            }
            serverDependenciesTree.push({
                text: `${d} ${trmDependencies[d]}${installedVersion}`,
                children: []
            });
        });
    }

    const clientTree: TreeLog = {
        text: `Client`,
        children: [{
            text: `trm-client ${clientVersion}`,
            children: clientDependenciesTree
        }]
    };
    Logger.tree(clientTree);

    const serverTree: TreeLog = {
        text: `Server`,
        children: serverDependenciesTree
    };
    Logger.tree(serverTree);
}