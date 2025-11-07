import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { AuthenticationType } from "trm-registry-types";

export class WhoAmI extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        this.registerOpts.onlyRegistryAlias = true;
        this.registerOpts.registryAuthBlacklist = [AuthenticationType.NO_AUTH];
        this.command.description(`Get data about a current registry logged user.`);
        this.command.addHelpText(`before`, `This command has no effect when trying to login into a registry that doesn't require authentication.`);
    }

    protected async handler(): Promise<void> {
        if(this.hasRegistryAuthData()){
            await this.registryWhoAmI();
        }else{
            Logger.error(`You are not logged in`);
            Logger.error(`Run command "trm login" and follow instructions.`);
        }
    }

}