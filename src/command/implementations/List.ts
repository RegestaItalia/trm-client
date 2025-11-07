import { Logger, TreeLog } from "trm-commons";
import { RegistryType, SystemConnector } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import chalk from "chalk";

export class List extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.command.description(`List TRM packages in a system.`);
        this.command.option(`-L, --locals`, `Include local packages (imported and exported)`, false);
        this.command.option(`-o, --output-type`, `Output type (TREE or TABLE)`, 'TREE');
    }

    protected async handler(): Promise<void> {
        const dest = SystemConnector.getDest();
        var aPackages = await this.getSystemPackages();
        var iLocals = aPackages.filter(o => o.registry.getRegistryType() === RegistryType.LOCAL).length;
        if (!this.args.locals) {
            aPackages = aPackages.filter(o => o.registry.getRegistryType() !== RegistryType.LOCAL);
        }
        if (aPackages.length > 0) {
            const tableHead = [`Name`, `Version`, `Registry`, `Devclass`, `TRM transport`, `Landscape transport`];
            var tableData = [];
            for (const oPackage of aPackages) {
                try {
                    const packageName = oPackage.packageName || '';
                    const version = oPackage.manifest.get().version || '';
                    const registry = oPackage.registry.getRegistryType() === RegistryType.LOCAL ? chalk.bold(oPackage.registry.name) : oPackage.registry.name;
                    const devclass = oPackage.getDevclass() || '';
                    const linkedTransport = oPackage.manifest.getLinkedTransport();
                    const landscapeTransport = await oPackage.getWbTransport();
                    var importTransport = '';
                    if (linkedTransport && (await linkedTransport.isImported())) {
                        importTransport = linkedTransport.trkorr;
                    }
                    tableData.push([
                        packageName,
                        version,
                        registry,
                        devclass,
                        importTransport,
                        landscapeTransport ? landscapeTransport.trkorr : ''
                    ]);
                } catch (e) {
                    Logger.error(e, true);
                }
            }
            if (tableData.length < aPackages.length) {
                Logger.warning(`${aPackages.length - tableData.length} packages couldn't be printed (check logs).`);
            }
            Logger.info(`${dest} has ${aPackages.length} packages.`);
            tableData = tableData.reverse();
            if (this.args.outputType === 'TABLE') {
                Logger.table(tableHead, tableData);
            } else if (this.args.outputType === 'TREE') {
                const grouped: { registry: string; packages: any[] }[] = (Object.entries(
                    tableData.reduce((acc, row) => ((acc[row[2]] ??= []).push(row), acc), {} as Record<string, any[]>) // row 2 contains registry
                ) as [string, any[]][]).map(([registry, packages]) => ({ registry, packages }));
                grouped.forEach(o => {
                    var tree: TreeLog = {
                        text: `Registry "${chalk.bold(o.registry)}"`,
                        children: []
                    };
                    o.packages.forEach(p => {
                        var packageTree: TreeLog = {
                            text: chalk.bold(`${p[0]} v${p[1]}`),
                            children: [{
                                text: `SAP Package: ${p[3]}`,
                                children: []
                            }]
                        };
                        if(p[4]){
                            packageTree.children.push({
                                text: `Import transport: ${p[4]}`,
                                children: []
                            });
                        }
                        if(p[5]){
                            packageTree.children.push({
                                text: `Landscape transport: ${p[5]}`,
                                children: []
                            });
                        }
                        tree.children.push(packageTree);
                    });
                    Logger.tree(tree);
                });
            } else {
                throw new Error(`Invalid output type "${this.args.outputType}".`);
            }
            if (iLocals > 0 && !this.args.locals) {
                Logger.warning(`There ${iLocals === 1 ? 'is' : 'are'} ${iLocals} local package${iLocals === 1 ? '' : 's'}. Run with option -L (--locals) to list ${iLocals === 1 ? 'it' : 'them'}.`);
            }
        } else {
            Logger.info(`${dest} has 0 packages.`);
        }
    }

}