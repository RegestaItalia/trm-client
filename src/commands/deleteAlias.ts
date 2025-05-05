import { Logger } from "trm-commons";
import { SystemAlias } from "../systemAlias";
import { DeleteAliasArguments } from "./arguments";

export async function deleteAlias(commandArgs: DeleteAliasArguments) {
    const alias = commandArgs.alias;
    //this throws if alias doesn't exist
    SystemAlias.get(alias);
    SystemAlias.delete(alias);
    Logger.success(`Alias "${alias}" deleted.`);
}