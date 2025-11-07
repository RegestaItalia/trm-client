import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { valid } from "semver";

export class Unpublish extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        this.command.description(`Unpublish a package release from registry.`);
        this.command.argument(`<package>`, `Name of the package.`);
        this.command.argument(`<version>`, `Version of the release.`);
    }

    protected async handler(): Promise<void> {
        if (!valid(this.args.version)) {
            throw new Error(`Invalid version.`);
        }

        await this.getRegistry().unpublish(this.args.package, this.args.version);
        const sOutput = `- ${this.args.package} ${this.args.version}`;
        Logger.success(sOutput);
    }

}