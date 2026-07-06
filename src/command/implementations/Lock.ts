import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { writeFileSync } from "fs";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";

export class Lock extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "lock",
        command: "lock",
        aliases: ["lock-file"],
        title: "Generate lockfile",
        group: "package",
        groupPriority: 6,
        description: "Generate a lockfile for an installed TRM package.",
        icon: "LockKeyhole",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package to lock." }),
            argument(1, { name: "outputPath", cliName: "output path", label: "Output path", description: "Path where the lockfile will be written.", required: false, defaultValue: "trm-lock.json", control: "file-picker", pickerType: "output" })
        ],
        options: [],
        requirements: {
            requiresConnection: true,
            requiresRegistry: true,
            ignoreRegistryUnreachable: true
        }
    };
    protected async handler(): Promise<void> {
        const packages = await this.getSystemPackages();
        Logger.loading(`Generating lock file...`);
        const source = packages.find(o => o.compareName(this.args.package) && o.compareRegistry(this.getRegistry()));
        if (!source) {
            throw new Error(`Package "${this.args.package}" not found`);
        }
        const lock = await source.getLockfile(packages);
        Logger.loading(`Writing lock file...`);
        writeFileSync(this.args.outputPath, lock.toJson());
        Logger.info(`Generated lock file "${this.args.outputPath}"`);
    }

}
