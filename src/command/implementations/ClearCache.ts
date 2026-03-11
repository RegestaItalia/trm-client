import { AbstractCommand } from "../AbstractCommand";
import { Logger } from "trm-commons";
import { GlobalContext } from "../../utils";

export class ClearCache extends AbstractCommand {

    protected init(): void {
        this.command.description(`Clear client cache.`);
    }

    protected async handler(): Promise<void> {
        GlobalContext.getInstance().clearCache();
        Logger.success(`Cache cleared`);
    }

}