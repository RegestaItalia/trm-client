import { ISystemConnector } from "trm-core";
import { SystemAlias } from "../systemAlias";
import { CreateAliasArguments } from "./arguments";
import { connect } from "./prompts";
import { Logger } from "trm-commons";

export async function createAlias(commandArgs: CreateAliasArguments,) {
    const connection = await connect({
        noSystemAlias: true,
        force: true
    }, false, false);
    const data = connection.getData();
    //create alias first because if it already exists it will throw an exception
    SystemAlias.create(commandArgs.alias, connection.name, data);
    connection.setData(data);
    Logger.loading(`Connecting to "${commandArgs.alias}"...`);
    var connectionSuccess = true;
    try {
        await (connection.getSystemConnector() as ISystemConnector).connect();
    } catch (e) {
        connectionSuccess = false;
        throw e;
    } finally {
        if (connectionSuccess) {
            Logger.success(`Alias "${commandArgs.alias}" created.`);
        } else {
            SystemAlias.delete(commandArgs.alias);
        }
    }
}