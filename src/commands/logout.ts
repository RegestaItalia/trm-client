import { Logger } from "trm-core";
import { RegistryAlias } from "../registryAlias";
import { LogoutArguments } from "./arguments";
import { CommandContext } from "./commons";

export async function logout(commandArgs: LogoutArguments) {
    try{
        await CommandContext.getRegistry().whoAmI();
        RegistryAlias.update(CommandContext.getRegistry().name, null);
        Logger.info(`Logged out.`);
    }catch(e){
        Logger.info(`Not logged in. Did you mean to use command "login"?`);
    }
}