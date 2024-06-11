import { Logger, SystemConnector } from "trm-core";
import { PingArguments } from "./arguments";

export async function ping(commandArgs: PingArguments) {
    const pingValue = await SystemConnector.ping();
    Logger.info(pingValue);
}