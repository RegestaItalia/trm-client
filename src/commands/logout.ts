import { RegistryAlias } from "../registryAlias";
import { ActionArguments, LogoutArguments } from "./arguments";

export async function logout(commandArgs: LogoutArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const registry = actionArgs.registry;
    try{
        await registry.whoAmI();
        RegistryAlias.update(registry.name, null);
        logger.info(`Logged out.`);
    }catch(e){
        logger.info(`Not logged in. Did you mean to use command "login"?`);
    }
}