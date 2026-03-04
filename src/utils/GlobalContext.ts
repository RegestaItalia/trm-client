import path from "path";
import { CacheData, getNpmPackageLatestVersion, getRoamingFolder, getRoamingPath, getTempFolder } from ".";
import * as fs from "fs";
import { SettingsData } from ".";
import * as ini from "ini";
import { IConnect, Logger, RESTConnect, RFCConnect, Plugin, getGlobalNodeModules as commonsGetGlobalNodeModules, PluginModule } from "trm-commons";
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
        return new RFCSystemConnector(data, data, getTempFolder(), GlobalContext.getInstance().getGlobalNodeModules());
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

    public getGlobalNodeModules(): string {
        //called before load
        if (!this._cache.globalNpmPath) {
            this.setGlobalNpmPathInternal();
        }
        return this._cache.globalNpmPath.data;
    }

    public getLatestVersion(): string {
        return this._cache.latestVersion.data;
    }

    public async load() {
        //global npm path
        this.setGlobalNpmPathInternal();
        //latest version
        const latestVersionCache = this._cache.latestVersion;
        if (!latestVersionCache || (latestVersionCache.ts && Date.now() - latestVersionCache.ts > this.getSettings().cliUpdateCheckCache * 1000)) {
            Logger.loading(`Cache expired, setting client latest version...`, true);
            const version = (await getNpmPackageLatestVersion('trm-client')).latest;
            Logger.log(`Client latest version set to ${version}`, true);
            this.setCache('latestVersion', version);
        }
        //load plugins
        if (!this._pluginsLoaded) {
            Logger.loading(`Loading plugins...`, true);
            this._plugins = await Plugin.load({
                globalNodeModulesPath: this.getGlobalNodeModules()
            });
            Logger.log(`Loaded ${this._plugins.length} plugins: ${this._plugins.map(o => o.name).join(', ')}`, true);
            Logger.loading(`Calling event onContextLoadConnections...`, true);
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
        var sapLandscape: string;
        switch (process.platform) {
            case 'win32':
                sapLandscape = path.join(getRoamingPath(), 'SAP', 'Common', 'SAPUILandscape.xml');
                break;
            case 'darwin':
                sapLandscape = path.join(getRoamingPath(), 'SAP', 'SAPGUILandscape.xml');
                break;
            default:
                break;
        }
        if (!sapLandscape || !fs.existsSync(sapLandscape)) {
            sapLandscape = undefined;
        }
        return {
            loggerType: 'CLI',
            logOutputFolder: 'default',
            cliUpdateCheckCache: 60,
            npmGlobalPathCheckCache: 180,
            sapLandscape
        }
    }

    private setGlobalNpmPathInternal(): void {
        const globalNpmPathCache = this._cache.globalNpmPath;
        const isValid = !!globalNpmPathCache && !!globalNpmPathCache.ts && (Date.now() - globalNpmPathCache.ts) < this.getSettings().npmGlobalPathCheckCache * 1000;
        if (isValid) {
            return globalNpmPathCache.data; 
        }
        Logger.loading(`Cache expired, setting npm global modules path...`, true);
        const path = commonsGetGlobalNodeModules();
        Logger.log(`Npm global modules path set to ${path}`, true);
        this.setCache('globalNpmPath', path);

    }

    private getSettingsInternal(): SettingsData {
        const defaultSettings = this.getDefaultSettings();
        const filePath = this.getSettingsFilePath();
        try {
            const sIni = fs.readFileSync(filePath).toString();
            const settingsData = ini.decode(sIni) as SettingsData;
            if (!settingsData.sapLandscape) {
                settingsData.sapLandscape = defaultSettings.sapLandscape;
                this.generateSettingsFile(settingsData, filePath);
            }
            if (!settingsData.cliUpdateCheckCache) {
                settingsData.cliUpdateCheckCache = defaultSettings.cliUpdateCheckCache;
                this.generateSettingsFile(settingsData, filePath);
            }
            if (!settingsData.npmGlobalPathCheckCache) {
                settingsData.npmGlobalPathCheckCache = defaultSettings.npmGlobalPathCheckCache;
                this.generateSettingsFile(settingsData, filePath);
            }
            // clear from legacy versions that had the node root in settings
            if ((settingsData as any).globalNodeModules) {
                delete (settingsData as any).globalNodeModules;
                this.generateSettingsFile(settingsData, filePath);
            }
            return settingsData;
        } catch (e) { }

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