import { extname, join } from "path";
import { AbstractCommand } from "../AbstractCommand";
import { cg3y } from "trm-core";
import { Logger } from "trm-commons";
import { writeFile } from "fs/promises";
import sanitize from "sanitize-filename";

export class Cg3y extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.requiresTrmDependencies = true;
        this.command.description(`Download any released transport.`);
        this.command.argument(`<transport>`, `Transport number.`);
        this.command.argument(`[filename]`, `Name (or path) of the output file.`);
    }

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