import { RegistryType, SystemConnector } from "trm-core";
import { ListArguments } from "./arguments";
import { CommandContext } from "./commons";
import chalk from "chalk";
import { Logger } from "trm-commons";

export async function list(commandArgs: ListArguments) {
    Logger.loading(`Reading packages...`);
    const dest = SystemConnector.getDest();
    var aPackages = await CommandContext.getSystemPackages();
    var iLocals = aPackages.filter(o => o.registry.getRegistryType() === RegistryType.LOCAL).length;
    if(!commandArgs.locals){
        aPackages = aPackages.filter(o => o.registry.getRegistryType() !== RegistryType.LOCAL);
    }
    if (aPackages.length > 0) {
        const tableHead = [`Name`, `Version`, `Registry`, `Devclass`, `Import transport`];
        var tableData = [];
        for (const oPackage of aPackages) {
            try{
                const packageName = oPackage.packageName || '';
                const version = oPackage.manifest.get().version || '';
                const registry = oPackage.registry.getRegistryType() === RegistryType.LOCAL ? chalk.bold(oPackage.registry.name) : oPackage.registry.name;
                const devclass = oPackage.getDevclass() || '';
                const linkedTransport = oPackage.manifest.getLinkedTransport();
                var importTransport = '';
                if(linkedTransport && (await linkedTransport.isImported())){
                    importTransport = linkedTransport.trkorr;
                }
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
        //Logger.log(`\n`);
        Logger.table(tableHead, tableData);
        if(iLocals > 0 && !commandArgs.locals){
            //Logger.log(`\n`);
            Logger.warning(`There ${iLocals === 1 ? 'is' : 'are'} ${iLocals} local package${iLocals === 1 ? '' : 's'}. Run with option -l (--locals) to list ${iLocals === 1 ? 'it' : 'them'}.`);
        }
    } else {
        Logger.info(`${dest} has 0 packages.`);
    }
}