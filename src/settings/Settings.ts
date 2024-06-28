import path from "path";
import { getRoamingFolder } from "../utils";
import * as fs from "fs";
import { SettingsData } from "./SettingsData";
import * as ini from "ini";

const SETTINGS_FILE_NAME = "settings.ini";

const defaultData: SettingsData = {
    alwaysUpdate: false
}

export class Settings {
    private static _instance: Settings = null;
    public data: SettingsData;

    constructor() {
        //load settings
        this.data = this.getSettings();
    }

    private getSettings(): SettingsData {
        const filePath = path.join(getRoamingFolder(), SETTINGS_FILE_NAME);
        if (fs.existsSync(filePath)) {
            try {
                const sIni = fs.readFileSync(filePath).toString();
                const settingsData = ini.decode(sIni) as SettingsData;
                return settingsData;
            } catch (e) { }
        }
        this.generateFile(defaultData, filePath);
        return defaultData;
    }

    private generateFile(data: SettingsData, filePath: string): void {
        fs.writeFileSync(filePath, ini.encode(data), { encoding: 'utf8', flag: 'w' });
    }

    public static getInstance(): Settings {
        if (!this._instance) {
            this._instance = new Settings();
        }
        return this._instance;
    }
}