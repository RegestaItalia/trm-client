import { Logger, TreeLog } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { RegistryType, SystemConnector } from "trm-core";
import chalk from "chalk";

export class FindDependencies extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.command.description(`Find SAP package dependencies with custom packages/trm packages/SAP entries/objects.`);
        this.command.argument(`<sap package>`, `Name of the SAP package to check.`);
        this.command.option(`--sap-entries`, `Show list of required SAP entries/objects.`, false);
        this.command.option(`--no-prompts`, `No prompts (will force some decisions).`);
    }

    protected async handler(): Promise<void> {
        Logger.loading(`Searching for dependencies in package "${this.args.sapPackage.toUpperCase()}"...`);
        const dependencies = await SystemConnector.getPackageDependencies(this.args.sapPackage.toUpperCase(), true, true);
        const trmPackageDependencies = dependencies.trmPackageDependencies;
        const sapPackageDependencies = dependencies.abapPackageDependencies.filter(o => !o.isCustomerPackage);
        const custPackageDependencies = dependencies.abapPackageDependencies.filter(o => o.isCustomerPackage);
        var tree: TreeLog = {
            text: `${chalk.bold(this.args.sapPackage.toUpperCase())} dependencies`,
            children: [{
                text: `TRM Packages (${trmPackageDependencies.length})`,
                children: trmPackageDependencies.map(o => {
                    return {
                        text: `${o.trmPackage.packageName}`,
                        children: [{
                            text: `Registry: ${o.trmPackage.registry.getRegistryType() === RegistryType.PUBLIC ? 'public' : o.trmPackage.registry.endpoint}`,
                            children: []
                        }, {
                            text: `Version: ^${o.trmPackage.manifest.get().version}`,
                            children: []
                        }]
                    }
                })
            }, {
                text: `Customer packages (${custPackageDependencies.length})`,
                children: custPackageDependencies.map(o => {
                    return {
                        text: `${o.abapPackage}`,
                        children: o.entries.map(t => {
                            return {
                                text: t.tableName,
                                children: t.dependency.map(k => {
                                    return {
                                        text: Object.entries(k.tableKey).map(([key, value]) => `${chalk.bold(key)}: ${value}`).join(', '),
                                        children: [{
                                            text: `Dependency found in ${k.foundIn.length} object${k.foundIn.length > 1 ? 's' : ''}`,
                                            children: k.foundIn.map(f => {
                                                return {
                                                    text: `${chalk.bold(f.object)} ${f.objName}`,
                                                    children: []
                                                }
                                            })
                                        }]
                                    }
                                })
                            }
                        })
                    }
                })
            }]
        };
        if (this.args.sapEntries) {
            tree.children.push({
                text: `SAP packages (${sapPackageDependencies.length})`,
                children: sapPackageDependencies.map(o => {
                    return {
                        text: `${o.abapPackage}`,
                        children: o.entries.map(t => {
                            return {
                                text: chalk.underline(t.tableName),
                                children: t.dependency.map(k => {
                                    return {
                                        text: Object.entries(k.tableKey).map(([key, value]) => `${chalk.bold(key)}: ${value}`).join(', '),
                                        children: [{
                                            text: `Dependency found in ${k.foundIn.length} object${k.foundIn.length > 1 ? 's' : ''}`,
                                            children: k.foundIn.map(f => {
                                                return {
                                                    text: `${chalk.bold(f.object)} ${f.objName}`,
                                                    children: []
                                                }
                                            })
                                        }]
                                    }
                                })
                            }
                        })
                    }
                })
            });
        } else {
            if (sapPackageDependencies.length > 0) {
                tree.children.push({
                    text: `SAP packages (${sapPackageDependencies.length})`,
                    children: [{
                        text: `Run with flag --sap-entries to view dependencies`,
                        children: []
                    }]
                });
            }
        }
        Logger.tree(tree);
    }

}