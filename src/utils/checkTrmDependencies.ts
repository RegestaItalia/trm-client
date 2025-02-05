import { Logger, Registry, SystemConnector } from "trm-core";
import { satisfies } from "semver";
import { getTrmDependencies } from "./getTrmDependencies";
import { CommandContext } from "../commands/commons";
import chalk from "chalk";

export async function checkTrmDependencies(commandArgs: any) {
    const trmDependencies = getTrmDependencies();
    if (trmDependencies && Object.keys(trmDependencies).length > 0) {
        const oPublicRegistry = new Registry('public');
        Logger.loading(`Reading system data...`);
        const packages = await CommandContext.getSystemPackages();
        Object.keys(trmDependencies).forEach(packageName => {
            const versionRange = trmDependencies[packageName];
            const installedPackage = packages.find(o => o.packageName === packageName && o.compareRegistry(oPublicRegistry));
            if (!installedPackage || !installedPackage.manifest) {
                if (commandArgs.command === 'info') {
                    CommandContext.missingTrmDependencies.push(packageName);
                } else {
                    throw new Error(`Package "${packageName}" is not installed on ${SystemConnector.getDest()}.`);
                }
            } else {
                const installedVersion = installedPackage.manifest.get().version;
                if (!satisfies(installedVersion, versionRange)) {
                    if (commandArgs.command === 'info') {
                        CommandContext.missingTrmDependencies.push(installedPackage);
                    } else if (!((commandArgs.command === 'install' || commandArgs.command === 'update') && commandArgs.package === packageName)) {
                        throw new Error(`Package "${packageName}" version ${installedVersion} is installed on ${SystemConnector.getDest()}, but does not satisfy dependency version ${versionRange}. Update with command ${chalk.italic('trm update ' + packageName)}`);
                    }
                } else {
                    CommandContext.trmDependencies.push(installedPackage);
                }
            }
        });
    }
}