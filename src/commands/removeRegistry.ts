import { RegistryAlias } from "../registryAlias";
import { ActionArguments, RemoveRegistryArguments } from "./arguments";

export async function removeRegistry(commandArgs: RemoveRegistryArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const inquirer = actionArgs.inquirer;
    const registryName = commandArgs.registry.trim();
    const oRegistry = RegistryAlias.get(registryName, logger);
    if(!oRegistry){
        throw new Error(`Registry "${registryName}" does not exist.`);
    }
    const force = commandArgs.force;
    const inq1 = await inquirer.prompt({
        type: "confirm",
        name: "removeRegistry",
        message: "Do you really want to remove this registry?",
        default: false,
        when: !force
    });
    const confirmRemove = inq1.removeRegistry !== undefined ? inq1.removeRegistry : force;
    if(!confirmRemove){
        logger.info(`Registry "${registryName}" was not removed.`);
    }else{
        RegistryAlias.delete(registryName);
        logger.success(`Registry removed.`);
    }
}