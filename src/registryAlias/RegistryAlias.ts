import { getRoamingFolder } from "../utils";
import path from "path";
import * as fs from "fs";
import * as ini from "ini";
import { RegistryAliasData } from "./RegistryAliasData";
import { PUBLIC_RESERVED_KEYWORD, Registry } from "trm-core";

const REGISTRY_FILE_NAME = "registry.ini";

export class RegistryAlias {

    public authData: any;

    constructor(private _endpoint: string, private _name: string) { }

    private setAuthData(data: any): RegistryAlias {
        if (data && Object.keys(data).length > 0) {
            this.authData = data;
        } else {
            this.authData = null;
        }
        return this;
    }

    public getRegistry(): Registry {
        return new Registry(this._endpoint, this._name);
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

    public static get(name: string): RegistryAlias {
        const aAlias = this.getAll();
        var alias = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        if (alias) {
            if (name.trim().toLowerCase() === PUBLIC_RESERVED_KEYWORD) {
                alias.endpointUrl = PUBLIC_RESERVED_KEYWORD;
                alias.alias = PUBLIC_RESERVED_KEYWORD;
            }
            return new RegistryAlias(alias.endpointUrl, alias.alias).setAuthData(alias.auth);
        }else{
            throw new Error(`Registry "${name}" not found.`);
        }
    }

    public static create(name: string, endpointUrl: string, auth: any = {}): RegistryAlias {
        var aAlias = this.getAll();
        const alreadyExists = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase()) ? true : false;
        if (alreadyExists) {
            throw new Error(`Alias already exists. Choose an unique name.`);
        } else {
            aAlias.push({
                alias: name,
                endpointUrl: endpointUrl.trim().toLowerCase() === PUBLIC_RESERVED_KEYWORD ? null : endpointUrl,
                auth
            });
            this.generateFile(aAlias);
        }
        return new RegistryAlias(endpointUrl, name).setAuthData(auth);
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

    public static generatePublicRegistryAlias(): void {
        const allRegistries = this.getAll();
        if(!allRegistries.find(o => o.alias.trim().toLowerCase() === PUBLIC_RESERVED_KEYWORD)){
            RegistryAlias.create(PUBLIC_RESERVED_KEYWORD, PUBLIC_RESERVED_KEYWORD, null);
        }
    }

    public static getTemporaryInstance(endpoint: string, auth?: any) : RegistryAlias {
        return new RegistryAlias(endpoint, endpoint).setAuthData(auth);
    }
    
}