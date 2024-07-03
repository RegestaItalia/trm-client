import { Logger, RegistryType, SystemConnector } from "trm-core";
import { ListArguments } from "./arguments";

export async function list(commandArgs: ListArguments) {
    Logger.loading(`Reading packages...`);
    const dest = SystemConnector.getDest();
    const aPackages = await SystemConnector.getInstalledPackages(true);
    if (aPackages.length > 0) {
        const tableHead = [`Name`, `Version`, `Registry`, `Devclass`, `Import transport`];
        var tableData = [];
        for (const oPackage of aPackages) {
            try{
                const packageName = oPackage.packageName || '';
                const version = oPackage.manifest.get().version || '';
                const registry = oPackage.registry.getRegistryType() === RegistryType.PUBLIC ? 'public' : oPackage.registry.endpoint;
                const devclass = oPackage.getDevclass() || '';
                const linkedTransport = oPackage.manifest.getLinkedTransport();
                const importTransport = linkedTransport ? linkedTransport.trkorr : '';
                tableData.push([
                    packageName,
                    version,
                    registry,
                    devclass,
                    importTransport
                ]);
            }catch(e){
                Logger.error(e, true);
            }
        }
        if(tableData.length < aPackages.length){
            Logger.warning(`${aPackages.length - tableData.length} packages couldn't be printed (check logs).`);
        }
        Logger.info(`${dest} has ${aPackages.length} packages.`);
        Logger.log(`\n`);
        Logger.table(tableHead, tableData);
    } else {
        Logger.info(`${dest} has 0 packages.`);
    }
}