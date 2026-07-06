import { Logger, TreeLog } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { RegistryType, SystemConnector } from "trm-core";
import chalk from "chalk";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class FindDependencies extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "find-dependencies",
        command: "find-dependencies",
        title: "Find dependencies",
        group: "utility",
        description: "Find TRM, customer package, and SAP object dependencies for an SAP package.",
        icon: "Search",
        arguments: [
            argument(0, { name: "sapPackage", cliName: "sap package", label: "SAP package", description: "SAP package to inspect." })
        ],
        options: [
            option("--sap-entries", { name: "sapEntries", label: "SAP entries", description: "Include required SAP table entries and objects.", control: "checkbox", defaultValue: false }),
            option("--no-prompts", { name: "prompts", label: "Prompts", description: "Disable prompts and use automatic decisions.", control: "checkbox", defaultValue: true }),
            option("--trm-found-in", { name: "trmFoundIn", label: "Dependency references", description: "Show which objects reference each TRM dependency.", control: "checkbox", defaultValue: false })
        ],
        requirements: {
            requiresConnection: true
        }
    };
    protected async handler(): Promise<void> {
        const dependencies = await SystemConnector.getPackageDependencies(this.args.sapPackage.toUpperCase(), true);
        const trmPackageDependencies = dependencies.trmPackageDependencies;
        const sapPackageDependencies = dependencies.abapPackageDependencies.filter(o => !o.isCustomerPackage);
        const custPackageDependencies = dependencies.abapPackageDependencies.filter(o => o.isCustomerPackage);
        var tree: TreeLog = {
            text: `${chalk.bold(this.args.sapPackage.toUpperCase())} dependencies`,
            children: [{
                text: `TRM Packages (${trmPackageDependencies.length})`,
                children: trmPackageDependencies.map(o => {
                    var packageLog = {
                        text: `${o.trmPackage.packageName}`,
                        children: [{
                            text: `Registry: ${o.trmPackage.registry.getRegistryType() === RegistryType.PUBLIC ? 'public' : o.trmPackage.registry.endpoint}`,
                            children: []
                        }, {
                            text: `Version: ^${o.trmPackage.manifest.get().version}`,
                            children: []
                        }]
                    };
                    if (this.args.trmFoundIn) {
                        packageLog.children.push({
                            text: `Found in ${o.foundIn.length} object${o.foundIn.length > 1 ? 's' : ''}`,
                            children: o.foundIn.map(f => {
                                return {
                                    text: `${f.object} ${f.objName}`,
                                    children: []
                                };
                            })
                        });
                    }
                    return packageLog;
                })
            }, {
                text: `Customer packages (${custPackageDependencies.length})`,
                children: custPackageDependencies.map(o => {
                    return {
                        text: `${o.abapPackage.devclass} (${o.entries.reduce((sum, entry) => sum + entry.dependency.length, 0)})`,
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
                        text: `${o.abapPackage} (${o.entries.reduce((sum, entry) => sum + entry.dependency.length, 0)})`,
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
        if(trmPackageDependencies.length > 0 && !this.args.trmFoundIn){
            Logger.warning(`To expand and see where TRM dependencies were found, execute with option --trm-found-in`);
        }
    }

}
