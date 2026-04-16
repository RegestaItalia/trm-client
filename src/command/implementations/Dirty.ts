import { Logger, TreeLog } from "trm-commons";
import { RegistryType, SystemConnector, Transport, ZTRM_DIRTY } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import chalk from "chalk";

export class Dirty extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.requiresRegistry = true;
        this.registerOpts.ignoreRegistryUnreachable = true;
        this.command.description(`Show local objetcs that flagged a package as dirty.`);
        this.command.argument(`<package>`, `Name of the dirty package to check.`);
        this.command.option(`--latest-only`, `Show only the latest transports with changes`, true);
    }

    private keepFirstByKey(entries: ZTRM_DIRTY[]): ZTRM_DIRTY[] {
        const seen = new Set<string>();

        return entries.filter(entry => {
            const key = `${entry.pgmid}|${entry.object}|${entry.objName}`;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }

    protected async handler(): Promise<void> {
        const packages = await this.getSystemPackages();
        const dirtyPackage = packages.find(o => o.compareName(this.args.package) && o.compareRegistry(this.getRegistry()));
        if (!dirtyPackage) {
            throw new Error(`Package "${this.args.package}" not found`);
        }
        if (!dirtyPackage.isDirty()) {
            throw new Error(`Package "${this.args.package}" is not flagged as dirty!`);
        }
        Logger.warning(`Package "${this.args.package}" is flagged as dirty!`);
        Logger.info(`This means that one (or more) of its objects were added/removed/changed and it's TRM manifest is ${chalk.bold('INVALID')}.`);
        Logger.info(`Here's a list that contains all entries that flagged the package.`);
        var dirtyEntries = dirtyPackage.getDirtyEntries();
        if(this.args.latestOnly){
            Logger.info(`Showing only the latest transports with changes.`);
            dirtyEntries = this.keepFirstByKey(dirtyEntries);
        }
        const tableHead = [`Transport`, `PGMID`, `OBJECT`, `OBJECT NAME`];
        var tableData = [];
        dirtyEntries.forEach(d => tableData.push([chalk.bold(d.trkorr), d.pgmid, d.object, d.objName]))
        Logger.table(tableHead, tableData);
    }

}