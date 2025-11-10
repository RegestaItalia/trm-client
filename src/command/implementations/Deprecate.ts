import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";

export class Deprecate extends AbstractCommand {
    
    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        this.command.description(`Deprecate a package release from registry.`);
        this.command.argument(`<package>`, `Name of the package.`);
        this.command.argument(`<version>`, `Version of the release.`);
        this.command.option(`--note <note>`, `Deprecation note`);
    }

    protected async handler(): Promise<void> {
        if(!this.args.note){
            throw new Error(`Provide a message with option "--note".`);
        }
        await this.getRegistry().deprecate(this.args.package, this.args.version, {
            deprecate_note: this.args.note
        });
        Logger.success(`${this.args.package} v${this.args.version} has just been deprecated`);
    }

}