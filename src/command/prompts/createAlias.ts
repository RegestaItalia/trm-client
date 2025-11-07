import { Logger } from "trm-commons";
import { SystemAlias } from "../../systemAlias";
import { connect } from "./connect";
import { ISystemConnector } from "trm-core";

export async function createAlias(alias: string) {
    const connection = await connect({
        noSystemAlias: true,
        force: true
    }, false, false);
    //create alias first because if it already exists it will throw an exception
    SystemAlias.create(alias, connection.name, connection.getData());
    Logger.loading(`Connecting to "${alias}"...`);
    var connectionSuccess = true;
    try {
        await (connection.getSystemConnector() as ISystemConnector).connect();
    } catch (e) {
        connectionSuccess = false;
        throw e;
    } finally {
        if (connectionSuccess) {
            Logger.success(`Alias "${alias}" has been created.`);
        } else {
            SystemAlias.delete(alias);
        }
    }
}