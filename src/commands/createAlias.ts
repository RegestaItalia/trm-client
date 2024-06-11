import { Logger } from "trm-core";
import { SystemAlias } from "../systemAlias";
import { ConnectArguments, CreateAliasArguments } from "./arguments";
import { connect } from "./prompts";

export async function createAlias(commandArgs: CreateAliasArguments,) {
    const connectionArgs = await connect({
        ...commandArgs, 
        ...{
            noSystemAlias: true
        }
    } as ConnectArguments, false);
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
    });
    var connectionSuccess = true;
    try{
        await alias.getConnection().connect();
    }catch(e){
        connectionSuccess = false;
        throw e;
    }finally{
        if(connectionSuccess){
            Logger.success(`Alias "${commandArgs.alias}" created.`);
        }else{
            SystemAlias.delete(commandArgs.alias);
        }
    }
}