import { Context } from "../utils";
import { SettingsArguments } from "./arguments";
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
        Context.getInstance().setSetting(key, value);
    }
    const settingsData = Context.getInstance().settings;
    Object.keys(settingsData).forEach(k => {
        Logger.log(`${k}: ${settingsData[k]}`);
    });
}