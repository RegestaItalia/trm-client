import { Inquirer } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { RegistryAlias } from "../../registryAlias";
import { AuthenticationType } from "trm-registry-types";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { option } from "../metadata/helpers";

export class Login extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "login",
        command: "login",
        title: "Log in",
        group: "registry",
        guiRelevant: false,
        description: "Log in to a registry.",
        longDescription: "This command has no effect for registries that do not require authentication.",
        icon: "LogIn",
        arguments: [],
        options: [
            option("-A, --registry-auth <authentication>", {
                name: "registryAuth",
                label: "Authentication data",
                description: "Registry authentication data as JSON, or a path to a JSON file.",
                control: "textarea",
                sensitive: true
            })
        ],
        requirements: {
            requiresRegistry: true,
            onlyRegistryAlias: true,
            registryAuthBlacklist: [AuthenticationType.NO_AUTH]
        }
    };
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
