import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { cg3z, SystemConnector, Transport } from "trm-core";
import { getTempFolder, GlobalContext } from "../../utils";
import { readFile } from "fs/promises";
import { extname } from "path";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";

export class Cg3z extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "cg3z",
        command: "cg3z",
        title: "Upload transport",
        group: "utility",
        groupPriority: 7,
        description: "Upload a released transport archive to the connected system.",
        icon: "Upload",
        arguments: [
            argument(0, { name: "filename", label: "Transport archive", description: "Transport archive file name or path.", control: "file-picker", pickerType: "input" })
        ],
        options: [],
        requirements: {
            requiresConnection: true,
            requiresTrmDependencies: true,
            requiresR3trans: true
        }
    };
    protected async handler(): Promise<void> {
        const extension = extname(this.args.filename);
        var transportLayer;
        try {
            transportLayer = await SystemConnector.getDefaultTransportLayer();
        } catch { }
        if(extension !== '.zip'){
            this.args.filename = this.args.filename + '.zip';
        }
        this.validateInputFileArg(this.args.filename);
        Logger.loading(`Reading file "${this.args.filename}"...`);
        const binaries = await readFile(this.args.filename);
        const result = await cg3z({
            r3transOptions: {
                tempDirPath: getTempFolder(),
                r3transDirPath: this.args.r3transPath,
                useDocker: GlobalContext.getInstance().getSettings().r3transDocker,
                dockerOptions: {
                    name: GlobalContext.getInstance().getSettings().r3transDockerName
                }
            },
            binaries
        });
        Logger.success(`Uploaded ${Transport.getTransportIcon()}  ${result.trkorr}`);
        Logger.info(`Transport is now available in transaction STMS, ${SystemConnector.getDest()} queue`);
        Logger.info(`-> Manually import into ${SystemConnector.getDest()} via STMS in the appropriate client`);
        Logger.info(`-> Manually change ${result.trkorr} workbench content origin system to ${SystemConnector.getDest()} via SE03 if needed`);
        Logger.info(`-> Manually change ${result.trkorr} SAP packages transport layer to ${transportLayer || 'default'} via SE80 if needed`);
    }

}
