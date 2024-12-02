import { InstallArguments, UpdateArguments } from "./arguments";
import { install } from "./install";

export async function update(commandArgs: UpdateArguments) {
    var installArguments = commandArgs as InstallArguments;
    installArguments.overwrite = true;
    await install(installArguments);
}