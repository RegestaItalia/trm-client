
import { UnpublishArguments } from "./arguments";
import * as semver from "semver";
import { CommandRegistry } from "./commons";
import { Logger } from "trm-core";

export async function unpublish(commandArgs: UnpublishArguments) {
    const packageName = commandArgs.package;
    const packageVersion = semver.clean(commandArgs.version || '');
    const registry = CommandRegistry.get();
    
    if(!packageVersion){
        throw new Error(`Invalid version.`);
    }

    await registry.unpublish(packageName, packageVersion);
    const sOutput = `- ${packageName} ${packageVersion} on ${registry.name}`;
    Logger.success(sOutput);
}