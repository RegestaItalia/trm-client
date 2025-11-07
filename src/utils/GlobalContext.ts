import path from "path";
import { CacheData, getRoamingFolder, getRoamingPath, getTempFolder } from ".";
import * as fs from "fs";
import { SettingsData } from ".";
import * as ini from "ini";
import { IConnect, Logger, RESTConnect, RFCConnect, Plugin, getGlobalNodeModules, PluginModule } from "trm-commons";
import { ISystemConnector, RESTSystemConnector, RFCSystemConnector } from "trm-core";

const CACHE_FILE_NAME = ".cache";
const SETTINGS_FILE_NAME = "settings.ini";

class RESTConnectExtended extends RESTConnect {

    public getSystemConnector(): ISystemConnector {
        const data = this.getData();
        return new RESTSystemConnector(data, data);
    }

}
class RFCConnectExtended extends RFCConnect {

    public getSystemConnector(): ISystemConnector {
        const data = this.getData();
        return new RFCSystemConnector(data, data, getTempFolder(), GlobalContext.getInstance().getSettings().globalNodeModules);
    }

}

export class GlobalContext {
    private static _instance: GlobalContext = null;

    private _pluginsLoaded: boolean = false;
    private _settings: SettingsData;
    private _cache: CacheData;
    private _connections: IConnect[] = [];
    private _plugins: PluginModule[] = [];

    constructor() {
        //load settings
        this._settings = this.getSettingsInternal();
        //load cache
        this._cache = this.getCacheInternal();
        if (typeof (this._settings.r3transDocker) !== 'boolean') {
            if (process.platform === 'darwin') {
                Logger.info(`R3trans defaults to docker in darwin os.`, true);
                this._settings.r3transDocker = true;
            }
        }
    }

    public getSettings(): SettingsData {
        return this._settings;
    }

    public getCache(): CacheData {
        return this._cache;
    }

    public async load() {
        if (!this._pluginsLoaded) {
            this._plugins = await Plugin.load({
                globalNodeModulesPath: this._settings.globalNodeModules
            });
            this._connections = await Plugin.call<IConnect[]>("client", "onContextLoadConnections", [new RESTConnectExtended(), new RFCConnectExtended()]);
            this._pluginsLoaded = true;
        }
    }

    public getPlugins(): PluginModule[] {
        return this._plugins;
    }

    public getConnections(): IConnect[] {
        return this.cloneArrayOfInstances(this._connections);
    }

    public setSetting(key: string, value: string): void {
        if (this._settings[key] === undefined) {
            throw new Error(`Invalid key ${key}.`);
        }
        const filePath = this.getSettingsFilePath();
        this._settings[key] = value;
        this.generateSettingsFile(this._settings, filePath);
    }

    public setCache(key: string, value: any): void {
        const filePath = this.getCacheFilePath();
        this._cache[key] = {
            ts: Date.now(),
            data: value
        };
        this.generateCacheFile(this._cache, filePath);
    }

    private cloneInstance<T>(obj: T): T {
        return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
    }

    private cloneArrayOfInstances<T>(arr: T[]): T[] {
        return arr.map(this.cloneInstance);
    }

    private getSettingsFilePath(): string {
        return path.join(getRoamingFolder(), SETTINGS_FILE_NAME);
    }

    private getCacheFilePath(): string {
        return path.join(getRoamingFolder(), CACHE_FILE_NAME);
    }

    private getDefaultSettings(): SettingsData {
        var sapLandscape = path.join(getRoamingPath(), process.platform === 'win32' ? 'SAP\\Common\\SAPUILandscape.xml' : 'SAP/SAPGUILandscape.xml');
        if (!fs.existsSync(sapLandscape)) {
            sapLandscape = undefined;
        }
        return {
            loggerType: 'CLI',
            logOutputFolder: 'default',
            globalNodeModules: getGlobalNodeModules() || '',
            sapLandscape
        }
    }

    private getSettingsInternal(): SettingsData {
        var defaultSettings: SettingsData;
        const filePath = this.getSettingsFilePath();
        if (fs.existsSync(filePath)) {
            try {
                const sIni = fs.readFileSync(filePath).toString();
                const settingsData = ini.decode(sIni) as SettingsData;
                if (!settingsData.globalNodeModules || !settingsData.sapLandscape) {
                    defaultSettings = this.getDefaultSettings();
                    if (!settingsData.globalNodeModules) {
                        settingsData.globalNodeModules = defaultSettings.globalNodeModules;
                    }
                    if (!settingsData.sapLandscape) {
                        settingsData.sapLandscape = defaultSettings.sapLandscape;
                    }
                    this.generateSettingsFile(settingsData, filePath);
                }
                return settingsData;
            } catch (e) { }
        }

        defaultSettings = this.getDefaultSettings();
        this.generateSettingsFile(defaultSettings, filePath);
        return defaultSettings;
    }

    private getCacheInternal(): CacheData {
        const filePath = this.getCacheFilePath();
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath).toString());
            } catch (e) { }
        }
        this.generateCacheFile({}, filePath);
        return {};
    }

    private generateSettingsFile(data: SettingsData, filePath: string): void {
        fs.writeFileSync(filePath, ini.encode(data), { encoding: 'utf8', flag: 'w' });
    }

    private generateCacheFile(data: CacheData, filePath: string): void {
        fs.writeFileSync(filePath, JSON.stringify(data), { encoding: 'utf8', flag: 'w' });
    }

    public static getInstance(): GlobalContext {
        if (!this._instance) {
            this._instance = new GlobalContext();
        }
        return this._instance;
    }
}