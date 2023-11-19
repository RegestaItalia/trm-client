import { RegistryAlias } from "../registryAlias";
import { ActionArguments, LoginArguments } from "./arguments";
import { whoami } from "./whoami";

export async function login(commandArgs: LoginArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const inquirer = actionArgs.inquirer;
    var registry = actionArgs.registry;
    var continueLogin = false;
    if(!commandArgs.force){
        try {
            const whoami = await registry.whoAmI();
            const inq1 = await inquirer.prompt({
                type: "confirm",
                name: "continue",
                message: `Already logged in as ${whoami.username}". Do you want to logout and continue?`,
                default: false
            });
            continueLogin = inq1.continue;
        } catch (e) {
            continueLogin = true;
        }
    }else{
        continueLogin = true;
    }
    if (continueLogin) {
        const auth = commandArgs.authentication;
        if (auth) {
            try {
                const oAuth = JSON.parse(auth);
                RegistryAlias.update(registry.name, oAuth);
            } catch (e) {
                throw new Error(`Invalid authentication JSON object.`);
            }
        }
        registry = await RegistryAlias.get(registry.name, logger).getRegistry(true, inquirer, false, true);
        logger.success('Logged in.');
        await whoami({}, {...actionArgs, ...{
            registry
        }});
    }
}