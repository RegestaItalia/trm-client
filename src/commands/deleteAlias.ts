import { Logger } from "trm-core";
import { SystemAlias } from "../systemAlias";
import { DeleteAliasArguments } from "./arguments";

export async function deleteAlias(commandArgs: DeleteAliasArguments) {
    const alias = commandArgs.alias;
    //this throws if alias doesn't exist
    SystemAlias.get(alias);
    SystemAlias.delete(alias);
    Logger.success(`Alias "${alias}" deleted.`);
}