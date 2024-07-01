import { Logger } from "trm-core";
import { WhoAmIArguments } from "./arguments";
import { CommandRegistry } from "./commons";

export async function whoami(commandArgs: WhoAmIArguments) {
    try {
        const whoAmI = await CommandRegistry.get().whoAmI();
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