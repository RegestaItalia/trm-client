import { Logger } from "trm-commons";
import { WhoAmIArguments } from "./arguments";
import { CommandContext } from "./commons";

export async function whoami(commandArgs: WhoAmIArguments) {
    try {
        const whoAmI = await CommandContext.getRegistry().whoAmI();
        Logger.info(`Username: ${whoAmI.user}`);
        if (whoAmI.messages) {
            whoAmI.messages.forEach(m => Logger.registryResponse(m));
        }
    } catch (e) {
        if (e.status === 401) {
            Logger.error(`You are not logged in`);
            if(!CommandContext.hasRegistryAuthData){
                Logger.error(`Run command "trm login" and follow instructions.`);
            }
        }
        throw e;
    }
}