import { Logger, TreeLog } from "trm-commons";
import { getCoreTrmDependencies, getNodePackage, RegistryProvider, SystemConnector, TrmPackage } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { DummyConnector, getClientNodeDependencies, getClientVersion, getNodeRfcPackage, getNpmPackageLatestVersion, GlobalContext } from "../../utils";
import { gte } from "semver";
import chalk from "chalk";
import { readFileSync } from "fs";
import { join } from "path";

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

        const globalNodeModulesPath = GlobalContext.getInstance().getGlobalNodeModules();
        const clientLatest = await this.getCliVersionStatus();
        const clientVersion = getClientVersion();
        const clientDependencies = getClientNodeDependencies();
        const trmDependencies = getCoreTrmDependencies(globalNodeModulesPath);
        const trmDependenciesInstances = (await this.getTrmDependenciesCheck()).dependencies;
        const trmMissingDependencies = (await this.getTrmDependenciesCheck()).missingDependencies;
        const nodeRfcPackage = getNodeRfcPackage();
        const packages = await this.getSystemPackages();
        const trmRest = packages.find(o => o.compareName("trm-rest") && o.compareRegistry(RegistryProvider.getRegistry()));
        const nodeR3transVersion = getNodePackage(globalNodeModulesPath, "node-r3trans")?.version;

        var clientDependenciesTree: TreeLog[] = [];
        if (clientDependencies) {
            for (const d of Object.keys(clientDependencies).filter(k => k.startsWith('trm'))) {
                var dText = ``;
                var dInstalledVersion = getNodePackage(globalNodeModulesPath, d)?.version;
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
                    var dInstalledVersion;
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
        if (nodeRfcPackage && nodeRfcPackage.version) {
            clientChildrenTree.push({
                text: await this.getNpmLatestForText('node-rfc', nodeRfcPackage.version, `node-rfc ${nodeRfcPackage.version}`),
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