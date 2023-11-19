import { ActionArguments, WhoAmIArguments } from "./arguments";

export async function whoami(commandArgs: WhoAmIArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const registry = actionArgs.registry;
    const whoAmI = await registry.whoAmI();
    logger.info(`Username: ${whoAmI.username}`);
    if (whoAmI.logonMessage) {
        logger.registryResponse(whoAmI.logonMessage);
    }
}