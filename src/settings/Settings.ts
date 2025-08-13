import path from "path";
import { getRoamingFolder } from "../utils";
import * as fs from "fs";
import { SettingsData } from "./SettingsData";
import * as ini from "ini";
import { Logger } from "trm-commons";

const SETTINGS_FILE_NAME = "settings.ini";

const defaultData: SettingsData = {
    loggerType: 'CLI',
    logOutputFolder: 'default'
}

export class Settings {
    private static _instance: Settings = null;
    public data: SettingsData;

    constructor() {
        //load settings
        this.data = this.getSettings();
        if (typeof (this.data.r3transDocker) !== 'boolean') {
            if (process.platform === 'darwin') {
                Logger.info(`R3trans defaults to docker in darwin os.`, true);
                this.data.r3transDocker = true;
            }
        }
    }

    public set(key: string, value: string): void {
        if (this.data[key] === undefined) {
            throw new Error(`Invalid key ${key}.`);
        }
        const filePath = this.getFilePath();
        this.data[key] = value;
        this.generateFile(this.data, filePath);
    }

    private getFilePath(): string {
        return path.join(getRoamingFolder(), SETTINGS_FILE_NAME);
    }

    private getSettings(): SettingsData {
        const filePath = this.getFilePath();
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