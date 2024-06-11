import { Inquirer, Logger } from "trm-core";
import { RegistryAlias } from "../registryAlias";
import { LoginArguments } from "./arguments";
import { CommandRegistry } from "./commons";
import { whoami } from "./whoami";

export async function login(commandArgs: LoginArguments) {
    var continueLogin = false;
    if(!commandArgs.force){
        try {
            const whoami = await CommandRegistry.get().whoAmI();
            const inq1 = await Inquirer.prompt({
                type: "confirm",
                name: "continue",
                message: `Already logged in as "${whoami.username}". Do you want to logout and continue?`,
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
        var oAuth: any;
        if (auth) {
            try {
                oAuth = JSON.parse(auth);
            } catch (e) {
                throw new Error(`Invalid authentication JSON object.`);
            }
        }else{
            oAuth = undefined;
        }
        await CommandRegistry.get().authenticate(oAuth);
        Logger.success('Logged in.');
        RegistryAlias.update(CommandRegistry.get().name, oAuth);
        await whoami({ });
    }
}