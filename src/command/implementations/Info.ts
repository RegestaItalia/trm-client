import { Logger, TreeLog } from "trm-commons";
import { getCoreTrmDependencies, RegistryProvider, SystemConnector, TrmPackage } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { DummyConnector, getClientNodeDependencies, getClientVersion, getNpmPackageLatestVersion, GlobalContext } from "../../utils";
import { gte } from "semver";
import chalk from "chalk";
import { readFileSync } from "fs";
import { join } from "path";
import { rootPath } from 'get-root-path';

export class Info extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.addNoConnection = true;
        this.registerOpts.requiresTrmDependencies = true;
        this.command.description(`TRM Client/Server Info. Shows installed and available updates.`);
    }

    protected onTrmDepMissing(dependency: string): boolean {
        // dependency is missing don't throw -> status will appear later in command
        return false;
    }

    protected onTrmDepVersionNotSatisfied(trmPackage: TrmPackage): boolean {
        // dependency version not satisfied don't throw -> status will appear later in command
        return false;
    }

    private getDependencyVersion(moduleName: string, rootModule: string = 'trm-client'): string | undefined {
        var file: Buffer;
        try {
            file = readFileSync(join(rootPath, `/node_modules/${rootModule}/node_modules/${moduleName}/package.json`));
        } catch (e) {
            file = readFileSync(join(rootPath, `/node_modules/${moduleName}/package.json`));
        }
        if (!file) {
            Logger.warning(`Library ${moduleName} (root ${rootModule}) was not found!`, true);
        } else {
            return JSON.parse(file.toString()).version;
        }
    }
    
    private getNodeRfcVersion(npmGlobal: string): string | undefined {
        var file: Buffer;
        try {
            file = readFileSync(join(npmGlobal, `/node-rfc/package.json`));
        } catch (e) {
            //
        }
        if (!file) {
            Logger.warning(`Library node-rfc was not found!`, true);
        } else {
            return JSON.parse(file.toString()).version;
        }
    }
    
    private async getNpmLatestForText(packageName: string, installedVersion: string, text: string): Promise<string> {
        try {
            const latestVersion = await getNpmPackageLatestVersion(packageName);
            if (gte(installedVersion, latestVersion)) {
                text += ` ${chalk.bgGreen('LATEST')}`;
            } else {
                text += ` ${chalk.bold('v' + latestVersion + ' available')}`;
            }
        } catch (e) {
            text += ` ${chalk.bgGray('Can\'t fetch latest version')}`;
        }
        return text;
    }

    protected async handler(): Promise<void> {
        Logger.loading(`Reading data...`);

        const npmGlobal = GlobalContext.getInstance().getSettings().globalNodeModules;
        const clientLatest = await this.getCliVersionStatus();
        const clientVersion = getClientVersion();
        const clientDependencies = getClientNodeDependencies();
        const trmDependencies = getCoreTrmDependencies();
        const trmDependenciesInstances = (await this.getTrmDependenciesCheck()).dependencies;
        const trmMissingDependencies = (await this.getTrmDependenciesCheck()).missingDependencies;
        const nodeRfcVersion = this.getNodeRfcVersion(npmGlobal);
        const packages = await this.getSystemPackages();
        const trmRest = packages.find(o => o.compareName("trm-rest") && o.compareRegistry(RegistryProvider.getRegistry()));

        //MIW: root changed!
        var nodeR3transVersion: string;
        try {
            nodeR3transVersion = this.getDependencyVersion("node-r3trans", "trm-core");
            if (!nodeR3transVersion) {
                throw new Error();
            }
        } catch (e) {
            nodeR3transVersion = this.getDependencyVersion("node-r3trans");
        }

        var clientDependenciesTree: TreeLog[] = [];
        if (clientDependencies) {
            for (const d of Object.keys(clientDependencies).filter(k => k.startsWith('trm'))) {
                var dText = ``;
                var dInstalledVersion = this.getDependencyVersion(d);
                if (dInstalledVersion) {
                    dText = ` -> ${dInstalledVersion}`;
                    dText = await this.getNpmLatestForText(d, dInstalledVersion, dText);
                }
                clientDependenciesTree.push({
                    text: `${d} ${clientDependencies[d]}${dText}`,
                    children: []
                });
            }
        }

        var serverDependenciesTree: TreeLog[] = [];
        if (trmDependencies) {
            for (const d of Object.keys(trmDependencies)) {
                var dText = ``;
                const oTrmPackage = trmDependenciesInstances.find(o => o.compareName(d));
                if (oTrmPackage) {
                    var dInstalledVersion: string;
                    try {
                        dInstalledVersion = oTrmPackage.manifest.get().version;
                    } catch (e) {
                        dText = ` -> ${e.message}`;
                    }
                    if (dInstalledVersion) {
                        dText = ` -> ${dInstalledVersion}`;
                        try {
                            const dLatestVersion = (await oTrmPackage.registry.getPackage(oTrmPackage.packageName, 'latest')).manifest.version;
                            if (gte(dInstalledVersion, dLatestVersion)) {
                                dText += ` ${chalk.bgGreen('LATEST')}`;
                            } else {
                                dText += ` ${chalk.bold('v' + dLatestVersion + ' available')}`;
                            }
                        } catch (e) {
                            dText += ` ${chalk.bgGray('Can\'t fetch latest version')}`;
                        }
                    }
                } else {
                    const missingDependency = trmMissingDependencies.find(o => {
                        if (typeof (o) === 'string') {
                            if (o === d) {
                                return o;
                            }
                        }
                    });
                    if (missingDependency) {
                        try {
                            dText = ` -> ${chalk.bgRed((missingDependency as any).manifest.get().version)}`;
                        } catch (e) {
                            dText = ` -> ${chalk.bgRed('Not found')}`;
                        }
                    }
                }
                serverDependenciesTree.push({
                    text: `${d} ${trmDependencies[d]}${dText}`,
                    children: []
                });
            }
        }
        if (trmRest && trmRest.manifest) {
            serverDependenciesTree.push({
                text: `trm-rest -> ${trmRest.manifest.get().version}`,
                children: []
            });
        }

        //build client tree
        var clientChildrenTree: TreeLog[] = [{
            text: `trm-client ${clientVersion} ${gte(clientLatest.localVersion, clientLatest.latestVersion) ? chalk.bgGreen('LATEST') : chalk.bold('v' + clientLatest.latestVersion + ' available')}`,
            children: clientDependenciesTree
        }];
        if (nodeRfcVersion) {
            clientChildrenTree.push({
                text: await this.getNpmLatestForText('node-rfc', nodeRfcVersion, `node-rfc ${nodeRfcVersion}`),
                children: []
            });
        } else {
            clientChildrenTree.push({
                text: `node-rfc ${chalk.bold('not found')}`,
                children: []
            });
        }
        if (nodeR3transVersion) {
            clientChildrenTree.push({
                text: await this.getNpmLatestForText('node-r3trans', nodeR3transVersion, `node-r3trans ${nodeR3transVersion}`),
                children: []
            });
        } else {
            clientChildrenTree.push({
                text: `node-r3trans ${chalk.bold('not found')}`,
                children: []
            });
        }
        const clientTree: TreeLog = {
            text: chalk.bold(`Client`),
            children: clientChildrenTree
        };

        //build server tree
        const serverTree: TreeLog = {
            text: chalk.bold(`Server (${SystemConnector.getDest()})`),
            children: serverDependenciesTree
        };

        //build plugins tree
        const pluginsTree: TreeLog = {
            text: chalk.bold(`Plugins`),
            children: []
        };
        for (const plugin of GlobalContext.getInstance().getPlugins()) {
            try {
                const installedVersion = JSON.parse(readFileSync(join(plugin.location, 'package.json')).toString()).version;
                pluginsTree.children.push({
                    text: await this.getNpmLatestForText(plugin.name, installedVersion, `${plugin.name} ${installedVersion}`),
                    children: []
                });
            } catch {
                pluginsTree.children.push({
                    text: plugin.name,
                    children: []
                });
            }
        }

        //print
        Logger.tree(clientTree);
        if (!(SystemConnector.systemConnector instanceof DummyConnector)) {
            Logger.tree(serverTree);
        }
        if (pluginsTree.children.length > 0) {
            Logger.tree(pluginsTree);
        }
    }

}