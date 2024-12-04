
import { UnpublishArguments } from "./arguments";
import * as semver from "semver";
import { Logger } from "trm-core";
import { CommandContext } from "./commons";

export async function unpublish(commandArgs: UnpublishArguments) {
    const packageName = commandArgs.package;
    const packageVersion = semver.clean(commandArgs.version || '');
    const registry = CommandContext.getRegistry();
    
    if(!packageVersion){
        throw new Error(`Invalid version.`);
    }

    await registry.unpublish(packageName, packageVersion);
    const sOutput = `- ${packageName} ${packageVersion} on ${registry.name}`;
    Logger.success(sOutput);
}