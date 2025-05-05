import { LOCAL_RESERVED_KEYWORD, PUBLIC_RESERVED_KEYWORD } from "trm-core";
import { RegistryAlias } from "../registryAlias";
import { AddRegistryArguments } from "./arguments";
import { Inquirer, Logger } from "trm-commons";

export async function addRegistry(commandArgs: AddRegistryArguments) {
    const registryName = commandArgs.registryName.trim();
    const auth = commandArgs.authentication;
    var endpoint = commandArgs.endpoint;
    var oAuth;
    if(registryName.toLowerCase() === PUBLIC_RESERVED_KEYWORD){
        throw new Error(`Registry name "${PUBLIC_RESERVED_KEYWORD}" is a reserved keyword.`);
    }
    if(registryName.toLowerCase() === LOCAL_RESERVED_KEYWORD){
        throw new Error(`Registry name "${LOCAL_RESERVED_KEYWORD}" is a reserved keyword.`);
    }
    if(auth){
        try{
            oAuth = JSON.parse(auth);
        }catch(e){
            throw new Error(`Invalid authentication JSON object.`);
        }
    }
    const inq1 = await Inquirer.prompt({
        type: "input",
        name: "endpoint",
        message: "Registry endpoint",
        default: endpoint,
        when: !endpoint
    });
    endpoint = inq1.endpoint || endpoint;
    const registry = RegistryAlias.create(registryName, endpoint, oAuth)
    var pingSuccess = true;
    try{
        const ping = await registry.getRegistry().ping();
        Logger.registryResponse(ping.wallMessage);
    }catch(e){
        Logger.error(`Ping to registry "${registryName}" (${endpoint}) failed.`);
        pingSuccess = false;
        throw e;
    }finally{
        if(pingSuccess){
            Logger.success(`Registry "${registryName}" added.`);
        }else{
            RegistryAlias.delete(registryName);
        }
    }
}