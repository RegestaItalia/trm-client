import { TrmDependencies, getClientVersion } from "../utils";
import { ActionArguments, InfoArguments } from "./arguments";

export async function info(commandArgs: InfoArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const clientVersion = getClientVersion();
    const trmServer = TrmDependencies.getInstance().get('trm-server');
    logger.info(`Client version: ${clientVersion}`);
    if(trmServer){
        logger.info(`Server version: ${trmServer.manifest!.get().version}`);
    }else{
        logger.warning(`Server version: not installed`);
    }
}