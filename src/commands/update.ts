import { InstallArguments, UpdateArguments } from "./arguments";
import { install } from "./install";

export async function update(commandArgs: UpdateArguments) {
    var installArguments = commandArgs as InstallArguments;
    installArguments.replaceAllowed = true;
    await install(installArguments);
}