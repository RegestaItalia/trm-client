import { Logger } from "trm-commons";
import { RegistryAlias } from "../../registryAlias";
import { AbstractCommand } from "../AbstractCommand";
import { AuthenticationType } from "trm-registry-types";

export class Logout extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        this.registerOpts.onlyRegistryAlias = true;
        this.registerOpts.registryAuthBlacklist = [AuthenticationType.NO_AUTH];
        this.command.description(`Log out of a registry.`);
        this.command.addHelpText(`before`, `This command has no effect when trying to login into a registry that doesn't require authentication.`);
    }

    protected async handler(): Promise<void> {
        const registry = this.getRegistry();
        if (this.hasRegistryAuthData()) {
            RegistryAlias.update(registry.name); //remove auth data
        } else {
            Logger.info(`Not logged in.`);
        }
    }

}