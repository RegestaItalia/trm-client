import { Inquirer, Logger, Registry } from "trm-core";
import { WhoAmI } from "trm-registry-types";
import { getRoamingFolder } from "../utils";
import path from "path";
import * as fs from "fs";
import * as ini from "ini";
import { RegistryAliasData } from "./RegistryAliasData";

const REGISTRY_FILE_NAME = "registry.ini";

export class RegistryAlias {

    private _authData: any;
    private _registryForcedLogin: boolean = false;

    constructor(private _endpoint: string, private _name: string, private _logger?: Logger) { }

    public getForcedLogin(): boolean {
        return this._registryForcedLogin;
    }

    private setAuthData(data: any): RegistryAlias {
        if (data && Object.keys(data).length > 0) {
            this._authData = data;
        } else {
            this._authData = null;
        }
        return this;
    }

    private async _getAuthenticated(inquirer: Inquirer, printWhoAmI: boolean, forceAuth: boolean) {
        var whoAmI: WhoAmI;
        const registry = new Registry(this._endpoint, this._name);
        if (this._authData || forceAuth) {
            await registry.authenticate(inquirer, this._logger, this._authData || {});
            this._authData = registry.getAuthData();
            if (this._authData) {
                whoAmI = await registry.whoAmI();
            }
            if (this._logger && printWhoAmI) {
                if (whoAmI.logonMessage) {
                    this._logger.registryResponse(whoAmI.logonMessage);
                }
            }
        }
        return registry;
    }

    public async getRegistry(forceAuth: boolean, inquirer: Inquirer, printPing: boolean = true, printWhoAmI: boolean = true, skipLogin: boolean = false, skipPing: boolean = false): Promise<Registry> {
        var registry: Registry;
        try {
            registry = await this._getAuthenticated(inquirer, printWhoAmI, forceAuth);
        } catch (e) {
            if(!skipLogin){
                //if this throws it means the auth data is expired
                //user must be prompted again
                this._logger.warning(`Login failed, update your credentials.`);
                this._authData = null;
                forceAuth = true;
                registry = await this._getAuthenticated(inquirer, printWhoAmI, forceAuth);
                this._registryForcedLogin = true;
            }else{
                registry = new Registry(this._endpoint, this._name);
                this._authData = null;
            }
        }
        if(!skipPing){
            const ping = await registry.ping();
            if (this._logger && printPing) {
                if (ping.wallMessage) {
                    this._logger.registryResponse(ping.wallMessage);
                }
            }
        }
        RegistryAlias.update(this._name, this._authData);
        return registry;
    }

    private static generateFile(content: RegistryAliasData[], filePath?: string): void {
        if (!filePath) {
            filePath = this.getSystemAliasFilePath();
        }
        var oContent = {};
        content.forEach(o => {
            const auth = o.auth;
            var sAuth: string;
            //miw
            if(typeof(auth) === 'string'){
                sAuth = auth;
            }else if(typeof(auth) === "object"){
                sAuth = JSON.stringify(o.auth);
            }else{
                sAuth = null;
            }
            oContent[o.alias] = {
                auth: sAuth
            };
            if (o.endpointUrl) {
                oContent[o.alias].endpoint = o.endpointUrl;
            }
        });
        fs.writeFileSync(filePath, ini.encode(oContent), { encoding: 'utf8', flag: 'w' });
    }

    private static getSystemAliasFilePath(): string {
        const filePath = path.join(getRoamingFolder(), REGISTRY_FILE_NAME);
        if (!fs.existsSync(filePath)) {
            this.generateFile([], filePath);
        }
        return filePath;
    }

    public static getAll(): RegistryAliasData[] {
        var aAlias: RegistryAliasData[] = [];
        const filePath = this.getSystemAliasFilePath();
        const sIni = fs.readFileSync(filePath).toString();
        const oIni = ini.decode(sIni);
        Object.keys(oIni).forEach(sAlias => {
            aAlias.push({
                alias: sAlias,
                endpointUrl: oIni[sAlias].endpoint,
                auth: JSON.parse(oIni[sAlias].auth)
            })
        })
        return aAlias;
    }

    public static get(name: string, logger?: Logger): RegistryAlias {
        const aAlias = this.getAll();
        var alias = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        if (alias) {
            if (name.trim().toLowerCase() === 'public') {
                alias.endpointUrl = 'public';
                alias.alias = 'public';
            }
            return new RegistryAlias(alias.endpointUrl, alias.alias, logger).setAuthData(alias.auth);
        }
    }

    public static create(name: string, endpointUrl: string, auth: any = {}, logger?: Logger): RegistryAlias {
        var aAlias = this.getAll();
        const alreadyExists = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase()) ? true : false;
        if (alreadyExists) {
            throw new Error(`Alias already exists. Choose an unique name.`);
        } else {
            aAlias.push({
                alias: name,
                endpointUrl: endpointUrl.trim().toLowerCase() === 'public' ? null : endpointUrl,
                auth
            });
            this.generateFile(aAlias);
        }
        return new RegistryAlias(endpointUrl, name, logger).setAuthData(auth);
    }

    public static delete(name: string): void {
        var aAlias = this.getAll();
        aAlias = aAlias.filter(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        this.generateFile(aAlias);
    }

    public static update(name: string, auth: any = {}): void {
        var aAlias = this.getAll();
        const alreadyExists = aAlias.findIndex(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        if (alreadyExists < 0) {
            throw new Error(`Alias doesn't exist, can't update.`);
        } else {
            aAlias[alreadyExists].auth = JSON.stringify(auth);
            this.generateFile(aAlias);
        }
    }
}