
import { UnpublishArguments } from "./arguments";
import * as semver from "semver";
import { CommandRegistry } from "./commons";
import { Logger } from "trm-core";

export async function unpublish(commandArgs: UnpublishArguments) {
    const packageName = commandArgs.package;
    const packageVersion = semver.clean(commandArgs.version || '');
    
    if(!packageVersion){
        throw new Error(`Invalid version.`);
    }

    await CommandRegistry.get().unpublish(packageName, packageVersion);

    Logger.success(`- ${packageName.trim()} v${packageVersion}`);
}