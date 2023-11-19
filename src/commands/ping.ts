import { ActionArguments, PingArguments } from "./arguments";

export async function ping(commandArgs: PingArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const connection = actionArgs.system;
    const pingValue = await connection.ping();
    logger.info(pingValue);
}