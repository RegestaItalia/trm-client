import { Inquirer, Logger } from "trm-core";
import { RegistryAlias } from "../registryAlias";
import { RemoveRegistryArguments } from "./arguments";

export async function removeRegistry(commandArgs: RemoveRegistryArguments) {
    const registryName = commandArgs.registryName.trim();
    //use get (this will throw if the registry alias doesn't exist)
    RegistryAlias.get(registryName);
    const force = commandArgs.force;
    const inq1 = await Inquirer.prompt({
        type: "confirm",
        name: "removeRegistry",
        message: `Do you really want to remove "${registryName}" registry?`,
        default: false,
        when: !force
    });
    const confirmRemove = inq1.removeRegistry !== undefined ? inq1.removeRegistry : force;
    if(!confirmRemove){
        Logger.info(`Registry "${registryName}" was not removed.`);
    }else{
        RegistryAlias.delete(registryName);
        Logger.success(`Registry removed.`);
    }
}