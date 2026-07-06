import { AbstractCommand } from "../AbstractCommand";
import { Logger } from "trm-commons";
import { GlobalContext } from "../../utils";
import { CommandMetadata } from "../metadata/CommandMetadata";

export class ClearCache extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "clear-cache",
        command: "clear-cache",
        title: "Clear cache",
        group: "utility",
        description: "Clear the client cache.",
        icon: "Trash2",
        arguments: [],
        options: [],
        requirements: {}
    };
    protected async handler(): Promise<void> {
        GlobalContext.getInstance().clearCache();
        Logger.success(`Cache cleared`);
    }

}
