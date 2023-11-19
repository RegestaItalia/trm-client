import { SystemAlias } from "../systemAlias";
import { ActionArguments, ConnectArguments, CreateAliasArguments } from "./arguments";
import { connect } from "./prompts";

export async function createAlias(commandArgs: CreateAliasArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const connectionArgs = await connect(commandArgs as ConnectArguments, actionArgs, false);
    const alias = SystemAlias.create(commandArgs.alias, {
        ashost: connectionArgs.ashost,
        dest: connectionArgs.dest,
        sysnr: connectionArgs.sysnr,
        saprouter: connectionArgs.saprouter
    }, {
        client: connectionArgs.client,
        lang: connectionArgs.lang,
        passwd: connectionArgs.passwd,
        user: connectionArgs.user
    }, logger);
    var connectionSuccess = true;
    try{
        await alias.getConnection().connect(false);
    }catch(e){
        connectionSuccess = false;
        throw e;
    }finally{
        if(connectionSuccess){
            logger.success(`Alias created.`);
        }else{
            SystemAlias.delete(commandArgs.alias);
        }
    }
}