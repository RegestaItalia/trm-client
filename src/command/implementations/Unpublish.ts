import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { valid } from "semver";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";

export class Unpublish extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "unpublish",
        command: "unpublish",
        title: "Unpublish release",
        group: "registry",
        groupPriority: 6,
        description: "Unpublish a package release from the registry.",
        icon: "PackageX",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name." }),
            argument(1, { name: "version", label: "Version", description: "Release version." })
        ],
        options: [],
        requirements: {
            requiresRegistry: true
        }
    };
    protected async handler(): Promise<void> {
        if (!valid(this.args.version)) {
            throw new Error(`Invalid version.`);
        }

        await this.getRegistry().unpublish(this.args.package, this.args.version);
        const sOutput = `- ${this.args.package} ${this.args.version}`;
        Logger.success(sOutput);
    }

}
