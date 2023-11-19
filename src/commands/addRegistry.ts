import { RegistryAlias } from "../registryAlias";
import { ActionArguments, AddRegistryArguments } from "./arguments";

export async function addRegistry(commandArgs: AddRegistryArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const inquirer = actionArgs.inquirer;
    const registryName = commandArgs.registry.trim();
    const auth = commandArgs.authentication;
    var endpoint = commandArgs.endpoint;
    var oAuth;
    if(registryName.toLowerCase() === 'public'){
        throw new Error(`Registry name "public" is a reserved keyword.`);
    }
    if(auth){
        try{
            oAuth = JSON.parse(auth);
        }catch(e){
            throw new Error(`Invalid authentication JSON object.`);
        }
    }
    const inq1 = await inquirer.prompt({
        type: "input",
        name: "endpoint",
        message: "Registry endpoint",
        default: endpoint,
        when: !endpoint
    });
    endpoint = inq1.endpoint || endpoint;
    const registry = RegistryAlias.create(registryName, endpoint, oAuth, logger);
    var pingSuccess = true;
    try{
        await registry.getRegistry(false, inquirer)
    }catch(e){
        pingSuccess = false;
        throw e;
    }finally{
        if(pingSuccess){
            logger.success(`Registry added.`);
        }else{
            RegistryAlias.delete(registryName);
        }
    }
}