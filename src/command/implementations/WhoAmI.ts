import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { AuthenticationType } from "trm-registry-types";
import { CommandMetadata } from "../metadata/CommandMetadata";

export class WhoAmI extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "whoami",
        command: "whoami",
        title: "Current user",
        group: "registry",
        guiRelevant: false,
        description: "Show the currently authenticated registry user.",
        longDescription: "This command has no effect for registries that do not require authentication.",
        icon: "UserRound",
        arguments: [],
        options: [],
        requirements: {
            requiresRegistry: true,
            onlyRegistryAlias: true,
            registryAuthBlacklist: [AuthenticationType.NO_AUTH]
        }
    };
    protected async handler(): Promise<void> {
        if(this.hasRegistryAuthData()){
            await this.registryWhoAmI();
        }else{
            Logger.error(`You are not logged in`);
            Logger.error(`Run command "trm login" and follow instructions.`);
        }
    }

}
