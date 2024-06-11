import { Logger } from "trm-core";
import { TrmDependencies, getClientVersion } from "../utils";
import { InfoArguments } from "./arguments";

export async function info(commandArgs: InfoArguments) {
    const clientVersion = getClientVersion();
    const trmServer = TrmDependencies.getInstance().get('trm-server');
    Logger.info(`trm-client version: ${clientVersion}`);
    if(trmServer){
        try{
            Logger.info(`trm-server version: ${trmServer.manifest!.get().version}`);
        }catch(e){
            Logger.error(`trm-server version: unknown`);
            Logger.error(e, true);
        }
    }else{
        Logger.warning(`trm-server version: not installed`);
    }
}