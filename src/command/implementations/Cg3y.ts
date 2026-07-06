import { extname, join } from "path";
import { AbstractCommand } from "../AbstractCommand";
import { cg3y } from "trm-core";
import { Logger } from "trm-commons";
import { writeFile } from "fs/promises";
import sanitize from "sanitize-filename";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";

export class Cg3y extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "cg3y",
        command: "cg3y",
        title: "Download transport",
        group: "utility",
        description: "Download a released transport from the connected system.",
        icon: "Download",
        arguments: [
            argument(0, { name: "transport", label: "Transport", description: "Transport request number." }),
            argument(1, { name: "filename", label: "Output file", description: "Output file name or path.", required: false, control: "file-picker" })
        ],
        options: [],
        requirements: {
            requiresConnection: true,
            requiresTrmDependencies: true
        }
    };
    protected async handler(): Promise<void> {
        if(!this.args.filename){
            this.args.filename = join(process.cwd(), `${sanitize(this.args.transport.toUpperCase())}.zip`);
        }
        const extension = extname(this.args.filename);
        if(extension !== '.zip'){
            this.args.filename = this.args.filename + '.zip';
        }
        this.validateOutputFileArg(this.args.filename);
        const result = await cg3y({
            trkorr: this.args.transport.toUpperCase()
        });
        Logger.loading(`Transport downloaded, writing data to disk...`);
        await writeFile(this.args.filename, result.binaries);
        Logger.success(`Transport available at "${this.args.filename}"`);
    }

}
