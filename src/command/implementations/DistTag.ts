import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";

export class DistTag extends AbstractCommand {

    public static readonly metadata: CommandMetadata[] = [
        {
            id: "dist-tag:add",
            command: "dist-tag",
            subcommand: "add",
            title: "Add distribution tag",
            group: "registry",
            groupPriority: 9,
            description: "Add a distribution tag to a package release.",
            icon: "TagPlus",
            arguments: [
                argument(0, { name: "package", label: "Package", description: "Package name." }),
                argument(1, { name: "version", label: "Version", description: "Release version." }),
                argument(2, { name: "tag", label: "Tag", description: "Distribution tag to assign." })
            ],
            options: [],
            requirements: {
                requiresRegistry: true
            }
        },
        {
            id: "dist-tag:rm",
            command: "dist-tag",
            subcommand: "rm",
            title: "Remove distribution tag",
            group: "registry",
            groupPriority: 8,
            description: "Remove a distribution tag from a package.",
            icon: "TagX",
            arguments: [
                argument(0, { name: "package", label: "Package", description: "Package name." }),
                argument(1, { name: "tag", label: "Tag", description: "Distribution tag to remove." })
            ],
            options: [],
            requirements: {
                requiresRegistry: true
            }
        }
    ];
    protected async handler(): Promise<void> {
        if (this.subcommand === 'add') {
            await this.getRegistry().addDistTag(this.args.package, {
                version: this.args.version,
                tag: this.args.tag
            });
            Logger.success(`${this.args.package} v${this.args.version} tagged "${this.args.tag}"`);
        } else if (this.subcommand === 'rm') {
            await this.getRegistry().rmDistTag(this.args.package, {
                tag: this.args.tag
            });
            Logger.success(`${this.args.package} removed tag "${this.args.tag}"`);
        }
    }

}
