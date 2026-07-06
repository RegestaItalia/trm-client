import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { GlobalContext } from "../../utils";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { option } from "../metadata/helpers";

export class Settings extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "settings",
        command: "settings",
        title: "Settings",
        group: "utility",
        guiRelevant: false,
        description: "Show or update client settings.",
        icon: "Settings",
        arguments: [],
        options: [
            option("-s, --set <property>", { name: "set", label: "Set property", description: "Setting to update, in KEY=VALUE format." })
        ],
        requirements: {
            requiresConnection: true,
            requiresTrmDependencies: true
        }
    };
    protected async handler(): Promise<void> {
        const setArgument = this.args.set;
        if (setArgument) {
            const aSplit = setArgument.split('=');
            if (aSplit.length !== 2) {
                throw new Error(`Invalid 'set' argument, must be in format KEY=VALUE.`);
            }
            const key = aSplit[0];
            const value = aSplit[1];
            GlobalContext.getInstance().setSetting(key, value);
        }
        const settingsData = GlobalContext.getInstance().getSettings();
        Object.keys(settingsData).forEach(k => {
            Logger.log(`${k}: ${settingsData[k]}`);
        });
    }

}
