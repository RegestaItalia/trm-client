import { RegistryAlias } from "../registryAlias";
import { LoginArguments } from "./arguments";
import { whoami } from "./whoami";
import { CommandContext } from "./commons";
import { Inquirer, Logger } from "trm-commons";

export async function login(commandArgs: LoginArguments) {
    var continueLogin = false;
    if(!commandArgs.force){
        try {
            const whoami = await CommandContext.getRegistry().whoAmI();
            const inq1 = await Inquirer.prompt({
                type: "confirm",
                name: "continue",
                message: `Already logged in as "${whoami.user}". Do you want to logout?`,
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
        await CommandContext.getRegistry().authenticate(oAuth);
        oAuth = CommandContext.getRegistry().getAuthData();
        Logger.success('Logged in.');
        RegistryAlias.update(CommandContext.getRegistry().name, oAuth);
        await whoami({ });
    }
}