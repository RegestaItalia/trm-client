import { AbstractCommand } from "../AbstractCommand";

export class DistTag extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        if (this.subcommand === 'add') {
            this.command.description(`Tag a release.`);
            this.command.argument(`<package>`, `Name of the package.`)
            this.command.argument(`<version>`, `Release version of the package.`)
            this.command.argument(`<tag>`, `Tag to assign to release.`)
        } else if (this.subcommand === 'rm') {
            this.command.description(`Remove tag from a release.`);
            this.command.argument(`<package>`, `Name of the package.`)
            this.command.argument(`<tag>`, `Tag to remove.`)
        }
    }

    protected async handler(): Promise<void> {
        if (this.subcommand === 'add') {
            await this.getRegistry().addDistTag(this.args.package, {
                version: this.args.version,
                tag: this.args.tag
            });
        } else if (this.subcommand === 'rm') {
            await this.getRegistry().rmDistTag(this.args.package, {
                tag: this.args.tag
            });
        }
    }

}