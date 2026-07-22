import { extname, join } from "path";
import { AbstractCommand } from "../AbstractCommand";
import { cg3y } from "trm-core";
import { Logger } from "trm-commons";
import { writeFile } from "fs/promises";
import sanitize from "sanitize-filename";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";

export class Changelog extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "changelog",
        command: "changelog",
        title: "Changelog",
        group: "utility",
        guiRelevant: false,
        description: "Show changelog of a release.",
        icon: "Diff",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name." }),
            argument(1, { name: "version", label: "Version", description: "Release version or distribution tag.", required: false, defaultValue: "latest" })
        ],
        options: [],
        requirements: {
            requiresRegistry: true
        }
    };
    protected async handler(): Promise<void> {
        const view = await this.getRegistry().getPackage(this.args.package, this.args.version);
        if(view.changelog){
            Logger.log(view.changelog);
        }else{
            Logger.info(`${this.args.package} ${this.args.version} has no changelog.`);
        }
    }

}
