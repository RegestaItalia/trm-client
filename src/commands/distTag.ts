import { DistTagArguments } from "./arguments";
import { CommandContext } from "./commons";

export async function distTag(commandArgs: DistTagArguments) {
    if (commandArgs.add) {
        await CommandContext.getRegistry().addDistTag(commandArgs.package, {
            version: commandArgs.version,
            tag: commandArgs.tag
        });
    } else if (commandArgs.rm) {
        await CommandContext.getRegistry().rmDistTag(commandArgs.package, {
            tag: commandArgs.tag
        });
    }
}