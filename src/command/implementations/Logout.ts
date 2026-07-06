import { Logger } from "trm-commons";
import { RegistryAlias } from "../../registryAlias";
import { AbstractCommand } from "../AbstractCommand";
import { AuthenticationType } from "trm-registry-types";
import { CommandMetadata } from "../metadata/CommandMetadata";

export class Logout extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "logout",
        command: "logout",
        title: "Log out",
        group: "registry",
        guiRelevant: false,
        description: "Log out of a registry.",
        longDescription: "This command has no effect for registries that do not require authentication.",
        icon: "LogOut",
        arguments: [],
        options: [],
        requirements: {
            requiresRegistry: true,
            onlyRegistryAlias: true,
            registryAuthBlacklist: [AuthenticationType.NO_AUTH]
        }
    };
    protected async handler(): Promise<void> {
        const registry = this.getRegistry();
        if (this.hasRegistryAuthData()) {
            RegistryAlias.update(registry.name); //remove auth data
        } else {
            Logger.info(`Not logged in.`);
        }
    }

}
