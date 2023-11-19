import { RegistryAlias } from "../../registryAlias";
import { ActionArguments } from "../arguments";

export async function pickRegistry(actionArgs: ActionArguments, alias?: string): Promise<RegistryAlias> {
    const inquirer = actionArgs.inquirer;
    const logger = actionArgs.logger;
    var registryAlias: RegistryAlias;
    var allRegistries = RegistryAlias.getAll();
    if(!allRegistries.find(o => o.alias.trim().toLowerCase() === 'public')){
        RegistryAlias.create('public', 'public', null, logger);
        allRegistries = RegistryAlias.getAll();
    }
    if(!alias){
        if(allRegistries.length === 1){
            registryAlias = RegistryAlias.get(allRegistries[0].alias, logger);
        }else{
            const inq1 = await inquirer.prompt({
                type: "list",
                name: "alias",
                message: `Select registry`,
                choices: allRegistries.map(o => {
                    return {
                        name: o.alias,
                        value: o.alias
                    }
                })
            });
            registryAlias = RegistryAlias.get(inq1.alias, logger);
        }
    }else{
        registryAlias = RegistryAlias.get(alias, logger);
    }
    return registryAlias;
}