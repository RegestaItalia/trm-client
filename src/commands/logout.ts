import { Logger } from "trm-core";
import { RegistryAlias } from "../registryAlias";
import { LogoutArguments } from "./arguments";
import { CommandRegistry } from "./commons";

export async function logout(commandArgs: LogoutArguments) {
    try{
        await CommandRegistry.get().whoAmI();
        RegistryAlias.update(CommandRegistry.get().name, null);
        Logger.info(`Logged out.`);
    }catch(e){
        Logger.info(`Not logged in. Did you mean to use command "login"?`);
    }
}