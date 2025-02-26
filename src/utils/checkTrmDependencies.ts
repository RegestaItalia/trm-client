import { checkCoreTrmDependencies, getCoreTrmDependencies, SystemConnector } from "trm-core";
import { CommandContext } from "../commands/commons";
import chalk from "chalk";

export async function checkTrmDependencies(commandArgs: any) {
    const packages = await CommandContext.getSystemPackages();
    const dependenciesCheck = await checkCoreTrmDependencies(packages);
    const trmDependencies = getCoreTrmDependencies();
    CommandContext.trmDependencies = CommandContext.trmDependencies.concat(dependenciesCheck.dependencies);
    dependenciesCheck.missingDependencies.forEach(missingDependency => {
        if (commandArgs.command === 'info') {
            CommandContext.missingTrmDependencies.push(missingDependency);
        }else{
            throw new Error(`Package "${missingDependency}" is not installed on ${SystemConnector.getDest()}.`);
        }
    });
    dependenciesCheck.versionNotSatisfiedDependencies.forEach(dependency => {
        if (commandArgs.command === 'info') {
            CommandContext.missingTrmDependencies.push(dependency);
        } else if (!((commandArgs.command === 'install' || commandArgs.command === 'update') && commandArgs.package === dependency.packageName)) {
            const versionRange = trmDependencies[dependency.packageName];
            throw new Error(`Package "${dependency.packageName}" version ${dependency.manifest.get().version} is installed on ${SystemConnector.getDest()}, but does not satisfy dependency version ${versionRange}. Update with command ${chalk.italic('trm update ' + dependency.packageName)}`);
        }
    });
}