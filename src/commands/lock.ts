import { LockArguments } from "./arguments";
import { CommandContext } from "./commons";
import { Logger } from "trm-commons";
import { writeFileSync } from "fs";


export async function lock(commandArgs: LockArguments) {
    Logger.loading(`Generating lock file...`);
    const packages = await CommandContext.getSystemPackages();
    const source = packages.find(o => o.compareName(commandArgs.package) && o.compareRegistry(CommandContext.getRegistry()));
    if(!source){
        throw new Error(`Package "${commandArgs.package}" not found`);
    }
    const lock = await source.getLockfile(packages);
    writeFileSync(commandArgs.outputPath, lock.toJson());
    Logger.info(`Generated lock file "${commandArgs.outputPath}"`);
}