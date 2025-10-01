import { getCoreTrmDependencies, PUBLIC_RESERVED_KEYWORD, Registry, SystemConnector } from "trm-core";
import { checkCliUpdate, Context, DummyConnector, getClientNodeDependencies, getClientVersion, getNpmPackageLatestVersion } from "../utils";
import { InfoArguments } from "./arguments";
import { CommandContext } from "./commons";
import { readFileSync } from "fs";
import { join } from "path";
import { rootPath } from 'get-root-path';
import chalk from "chalk";
import { gte } from "semver";
import { Logger, TreeLog } from "trm-commons";

const _getDependencyVersion = (moduleName: string, rootModule: string = 'trm-client') => {
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

const _getNodeRfcVersion = (npmGlobal: string) => {
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

const _getNpmLatestForText = async (packageName: string, installedVersion: string, text: string) => {
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

export async function info(commandArgs: InfoArguments) {
    Logger.loading(`Reading data...`);

    const npmGlobal = Context.getInstance().getSettings().globalNodeModules;
    const clientLatest = await checkCliUpdate(false);
    const clientVersion = getClientVersion();
    const clientDependencies = getClientNodeDependencies();
    const trmDependencies = getCoreTrmDependencies();
    const trmDependenciesInstances = CommandContext.trmDependencies;
    const trmMissingDependencies = CommandContext.missingTrmDependencies;
    const nodeRfcVersion = _getNodeRfcVersion(npmGlobal);
    const packages = await CommandContext.getSystemPackages();
    const trmRest = packages.find(o => o.compareName("trm-rest") && o.compareRegistry(new Registry(PUBLIC_RESERVED_KEYWORD)));

    //MIW: root changed!
    var nodeR3transVersion;
    try {
        nodeR3transVersion = _getDependencyVersion("node-r3trans", "trm-core");
        if (!nodeR3transVersion) {
            throw new Error();
        }
    } catch (e) {
        nodeR3transVersion = _getDependencyVersion("node-r3trans");
    }

    var clientDependenciesTree: TreeLog[] = [];
    if (clientDependencies) {
        for (const d of Object.keys(clientDependencies).filter(k => k.startsWith('trm'))) {
            var dText = ``;
            var dInstalledVersion = _getDependencyVersion(d);
            if (dInstalledVersion) {
                dText = ` -> ${dInstalledVersion}`;
                dText = await _getNpmLatestForText(d, dInstalledVersion, dText);
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
                        const dLatestVersion = (await oTrmPackage.fetchRemoteManifest('latest')).get().version;
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
                    } else {
                        if (o.compareName(d)) {
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
            text: await _getNpmLatestForText('node-rfc', nodeRfcVersion, `node-rfc ${nodeRfcVersion}`),
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
            text: await _getNpmLatestForText('node-r3trans', nodeR3transVersion, `node-r3trans ${nodeR3transVersion}`),
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
    for (const plugin of Context.getInstance().getPlugins()) {
        try {
            const installedVersion = JSON.parse(readFileSync(join(plugin.location, 'package.json')).toString()).version;
            pluginsTree.children.push({
                text: await _getNpmLatestForText(plugin.name, installedVersion, `${plugin.name} ${installedVersion}`),
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