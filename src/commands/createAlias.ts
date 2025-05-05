import { SystemAlias } from "../systemAlias";
import { CreateAliasArguments } from "./arguments";
import { connect } from "./prompts";
import { SystemConnectorType } from "../utils";
import { Logger } from "trm-commons";

export async function createAlias(commandArgs: CreateAliasArguments,) {
    const connectionArgs = await connect({
        noSystemAlias: true,
        force: true
    }, false);
    var alias: SystemAlias;
    if(connectionArgs.type === SystemConnectorType.RFC){
        alias = SystemAlias.create(commandArgs.alias, connectionArgs.type, {
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
    }else if(connectionArgs.type === SystemConnectorType.REST){
        alias = SystemAlias.create(commandArgs.alias, connectionArgs.type, {
            endpoint: connectionArgs.endpoint,
            rfcdest: connectionArgs.forwardRfcDest
        }, {
            lang: connectionArgs.lang,
            passwd: connectionArgs.passwd,
            user: connectionArgs.user
        });
    }
    if(alias){
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
    }else{
        throw new Error(`Alias "${commandArgs.alias}" couldn't be created.`);
    }
}