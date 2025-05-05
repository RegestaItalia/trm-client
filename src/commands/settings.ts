import { SettingsArguments } from "./arguments";
import { Settings } from "../settings";
import { Logger } from "trm-commons";

export async function settings(commandArgs: SettingsArguments) {
    const setArgument = commandArgs.set;
    if(setArgument){
        const aSplit = setArgument.split('=');
        if(aSplit.length !== 2){
            throw new Error(`Invalid 'set' argument, must be in format KEY=VALUE.`);
        }
        const key = aSplit[0];
        const value = aSplit[1];
        Settings.getInstance().set(key, value);
    }
    const settingsData = Settings.getInstance().data;
    Object.keys(settingsData).forEach(k => {
        Logger.log(`${k}: ${settingsData[k]}`);
    });
}