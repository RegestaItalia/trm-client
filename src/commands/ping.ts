import { SystemConnector } from "trm-core";
import { PingArguments } from "./arguments";
import { Logger } from "trm-commons";

export async function ping(commandArgs: PingArguments) {
    Logger.loading(`Pinging trm-server on ${SystemConnector.getDest()}...`);
    const pingValue = await SystemConnector.ping();
    Logger.info(pingValue);
}