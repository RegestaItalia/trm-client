import { Logger, TreeLog } from "trm-commons";
import { getCoreTrmDependencies, getNodePackage, RegistryProvider, SystemConnector, TrmPackage } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { DummyConnector, getClientNodeDependencies, getClientVersion, getNodeRfcPackage, getNpmPackageLatestVersion, GlobalContext } from "../../utils";
import { gte, eq, maxSatisfying } from "semver";
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

    private async getNpmLatestForText(packageName: string, installedVersion: string, range?: string): Promise<string> {
        var text = ``;
        try {
            const latestVersion = await getNpmPackageLatestVersion(packageName, range);
            if (gte(installedVersion, latestVersion.latest)) {
                if (!eq(latestVersion.latest, latestVersion.actualLatest)) {
                    text += ` ${chalk.bgGreen('LATEST COMPATIBLE')}`;
                } else {
                    text += ` ${chalk.bgGreen('LATEST')}`;
                }
            } else {
                text += ` ${chalk.bold('v' + latestVersion.latest + ' available')}`;
            }
        } catch (e) {
            text += ` ${chalk.bgGray('Can\'t fetch latest version')}`;
        }
        return text;
    }

    private flat(deps: Record<string, string>, globalNodeModulesPath: string): Record<string, { range: string; installedVersion: string | undefined }> {
        const isWanted = (k: string) => k.startsWith("trm-") || k === "node-r3trans";

        const out: Record<string, { range: string; installedVersion: string | undefined }> = {};
        const seen = new Set<string>();
        const q = Object.entries(deps).filter(([k]) => isWanted(k));

        while (q.length) {
            const [k, v] = q.pop()!;
            if (seen.has(k)) continue;
            seen.add(k);

            const pkg = getNodePackage(globalNodeModulesPath, k);
            const installedVersion = pkg?.version;

            if (!out[k]) {
                out[k] = {
                    range: v,
                    installedVersion
                };
            }

            const d = pkg?.dependencies ?? {};
            for (const [kk, vv] of Object.entries(d)) {
                if (isWanted(kk) && !seen.has(kk)) {
                    q.push([kk, vv as string] as const);
                }
            }
        }

        return out;
    }

    protected async handler(): Promise<void> {
        Logger.loading(`Reading data...`);

        const globalNodeModulesPath = GlobalContext.getInstance().getGlobalNodeModules();
        const clientLatest = await this.getCliVersionStatus();
        const clientVersion = getClientVersion();
        const dependencies = this.flat(getClientNodeDependencies(), globalNodeModulesPath);
        const trmDependencies = getCoreTrmDependencies(globalNodeModulesPath);
        const trmDependenciesInstances = (await this.getTrmDependenciesCheck()).dependencies;
        const trmMissingDependencies = (await this.getTrmDependenciesCheck()).missingDependencies;
        const trmNotSatisfiedDependencies = (await this.getTrmDependenciesCheck()).versionNotSatisfiedDependencies;
        const nodeRfcPackage = getNodeRfcPackage();
        const packages = await this.getSystemPackages();
        const trmRest = packages.find(o => o.compareName("trm-rest") && o.compareRegistry(RegistryProvider.getRegistry()));

        var dependenciesTree: TreeLog[] = [];
        for (const d of Object.keys(dependencies)) {
            const dText = ` -> ${dependencies[d].installedVersion} ${await this.getNpmLatestForText(d, dependencies[d].installedVersion, dependencies[d].range)}`;
            dependenciesTree.push({
                text: `${d} ${dependencies[d].range}${dText}`,
                children: []
            });
        }

        var serverDependenciesTree: TreeLog[] = [];
        if (trmDependencies) {
            for (const d of Object.keys(trmDependencies)) {
                var dText = ``;
                const oTrmPackage = trmDependenciesInstances.concat(trmNotSatisfiedDependencies).find(o => o.compareName(d));
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
                            const dLatestVersion = await oTrmPackage.registry.getPackage(oTrmPackage.packageName, 'latest');
                            const dMax = maxSatisfying(dLatestVersion.versions, trmDependencies[d]);
                            if (gte(dInstalledVersion, dMax)) {
                                if (!eq(dLatestVersion.dist_tags.latest, dMax)) {
                                    dText += ` ${chalk.bgGreen('LATEST COMPATIBLE')}`;
                                } else {
                                    dText += ` ${chalk.bgGreen('LATEST')}`;
                                }
                            } else {
                                dText += ` ${chalk.bold('v' + dLatestVersion.dist_tags.latest + ' available')}`;
                            }
                        } catch (e) {
                            dText += ` ${chalk.bgGray('Can\'t fetch latest version')}`;
                        }
                    }
                } else {
                    const missingDependency = trmMissingDependencies.find(o => o === d);
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
            children: dependenciesTree
        }];
        if (nodeRfcPackage && nodeRfcPackage.version) {
            clientChildrenTree.push({
                text: `node-rfc ${nodeRfcPackage.version} ${await this.getNpmLatestForText('node-rfc', nodeRfcPackage.version)}`,
                children: []
            });
        } else {
            clientChildrenTree.push({
                text: `node-rfc ${chalk.bold('not found')}`,
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
                    text: `${plugin.name} ${installedVersion} ${await this.getNpmLatestForText(plugin.name, installedVersion)}`,
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