import { Logger } from "trm-commons";
import { SystemAlias } from "../../systemAlias";

export async function deleteAlias(alias: string) {
    //this throws if alias doesn't exist
    SystemAlias.get(alias);
    SystemAlias.delete(alias);
    Logger.success(`Alias "${alias}" has been deleted.`);
}