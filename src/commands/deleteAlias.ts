import { SystemAlias } from "../systemAlias";
import { ActionArguments, DeleteAliasArguments } from "./arguments";

export async function deleteAlias(commandArgs: DeleteAliasArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const alias = commandArgs.alias;
    const oAlias = SystemAlias.get(alias);
    if(oAlias){
        SystemAlias.delete(alias);
        logger.success(`Alias "${alias}" deleted.`);
    }else{
        throw new Error(`Alias "${alias}" doesn't exist.`);
    }
}