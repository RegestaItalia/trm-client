
import { ActionArguments, UnpublishArguments } from "./arguments";
import * as semver from "semver";

export async function unpublish(commandArgs: UnpublishArguments, actionArgs: ActionArguments) {
    const registry = actionArgs.registry;
    const logger = actionArgs.logger;

    const packageName = commandArgs.package;
    const packageVersion = semver.clean(commandArgs.version || '');
    
    if(!packageVersion){
        throw new Error(`Missing required option --version`);
    }

    await registry.unpublish(packageName, packageVersion);

    logger.success(`- ${packageName.trim()} v${packageVersion}`);
}