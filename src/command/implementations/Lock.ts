import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { writeFileSync } from "fs";

export class Lock extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.requiresRegistry = true;
        this.registerOpts.ignoreRegistryUnreachable = true;
        this.command.description(`Generate a lockfile for a TRM package.`);
        this.command.argument(`<package>`, `Name of the package to generate lock file.`);
        this.command.argument(`[output path]`, `Output path.`, 'trm-lock.json');
    }

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