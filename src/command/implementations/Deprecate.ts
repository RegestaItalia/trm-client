import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class Deprecate extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "deprecate",
        command: "deprecate",
        title: "Deprecate release",
        group: "registry",
        description: "Deprecate a package release in the registry.",
        icon: "ArchiveX",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name." }),
            argument(1, { name: "version", label: "Version", description: "Release version." })
        ],
        options: [
            option("--note <note>", { name: "note", label: "Deprecation note", description: "Message shown for the deprecated release." })
        ],
        requirements: {
            requiresRegistry: true
        }
    };
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
