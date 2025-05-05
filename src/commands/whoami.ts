import { Logger } from "trm-commons";
import { WhoAmIArguments } from "./arguments";
import { CommandContext } from "./commons";

export async function whoami(commandArgs: WhoAmIArguments) {
    try {
        const whoAmI = await CommandContext.getRegistry().whoAmI();
        Logger.info(`Username: ${whoAmI.username}`);
        if (whoAmI.logonMessage) {
            Logger.registryResponse(whoAmI.logonMessage);
        }
    } catch (e) {
        if (e.status === 400) {
            Logger.error(`Registry response error: ${e.status} ${e.response}`, true);
            Logger.error(`Not logged in.`);
        } else {
            throw e;
        }
    }
}