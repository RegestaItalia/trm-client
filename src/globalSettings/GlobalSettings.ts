import { getRoamingFolder } from "../utils";
import path from "path";
import * as fs from "fs";
import * as ini from "ini";
import { GlobalSettingsData } from "./GlobalSettingsData";

const SETTINGS_FILE_NAME = "settings.ini";

export class GlobalSettings {

    private static getGlobalSettingsFilePath(): string {
        const filePath = path.join(getRoamingFolder(), SETTINGS_FILE_NAME);
        if(!fs.existsSync(filePath)){
            this.generateFile({
                alwaysUpdate: false
            }, filePath);
        }
        return filePath;
    }

    private static generateFile(content: GlobalSettingsData, filePath?: string): void {
        if(!filePath){
            filePath = this.getGlobalSettingsFilePath();
        }
        fs.writeFileSync(filePath, ini.encode(content), {encoding:'utf8',flag:'w'});
    }
    
    private static set(property: string, value: any): void {
        const sPath = this.getGlobalSettingsFilePath();
        const sSettings = fs.readFileSync(sPath).toString();
        var oSettings = ini.decode(sSettings) as GlobalSettingsData;
        oSettings[property] = value;
        this.generateFile(oSettings, sPath);
    }

    private static get(): GlobalSettingsData {
        const sPath = this.getGlobalSettingsFilePath();
        const sSettings = fs.readFileSync(sPath).toString();
        return ini.decode(sSettings) as GlobalSettingsData;
    }

    public static setAlwaysUpdate(alwaysUpdate: boolean = false): void {
        this.set("alwaysUpdate", alwaysUpdate);
    }

    public static getAlwaysUpdate(): boolean {
        return this.get().alwaysUpdate;
    }
}