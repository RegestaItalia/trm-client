import { Inquirer } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { RegistryAlias } from "../../registryAlias";
import { AuthenticationType } from "trm-registry-types";

export class Login extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        this.registerOpts.onlyRegistryAlias = true;
        this.registerOpts.registryAuthBlacklist = [AuthenticationType.NO_AUTH];
        this.command.description(`Log into a registry.`);
        this.command.addHelpText(`before`, `This command has no effect when trying to login into a registry that doesn't require authentication.`);
        this.command.option(`-A, --registry-auth <authentication>`, `Registry authentication (JSON or path to JSON file).`); //<- copy from abstract registry
    }

    protected async handler(): Promise<void> {
        const registry = this.getRegistry();
        var authData: any;
        if (this.parseJsonArg('registryAuth')) {
            if (!this.getRegistryAuthError()) {
                authData = registry.getAuthData();
            }
        } else {
            var continueLogin: boolean;
            try {
                const whoami = await registry.whoAmI();
                continueLogin = (await Inquirer.prompt({
                    type: "confirm",
                    name: "continue",
                    message: `Already logged in as "${whoami.user}". Do you want to logout?`,
                    default: false
                })).continue;
            } catch {
                continueLogin = true;
            }
            if (continueLogin) {
                await registry.authenticate({});
                authData = registry.getAuthData();
            }
        }
        if (authData) {
            RegistryAlias.update(registry.name, authData);
            try{
                await this.registryWhoAmI();
            }catch{
                RegistryAlias.update(registry.name); //remove auth data
            }
        }
    }

}