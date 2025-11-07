import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { GlobalContext } from "../../utils";

export class Settings extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.requiresTrmDependencies = true;
        this.command.description(`Show/Set settings.`);
        this.command.option(`-s, --set <property>`, `Property as KEY=VALUE.`);
    }

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