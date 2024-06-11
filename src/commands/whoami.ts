import { Logger } from "trm-core";
import { WhoAmIArguments } from "./arguments";
import { CommandRegistry } from "./commons";

export async function whoami(commandArgs: WhoAmIArguments) {
    const whoAmI = await CommandRegistry.get().whoAmI();
    Logger.info(`Username: ${whoAmI.username}`);
    if (whoAmI.logonMessage) {
        Logger.registryResponse(whoAmI.logonMessage);
    }
}