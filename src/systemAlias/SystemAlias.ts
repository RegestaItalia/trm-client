import { Connection, Login, ServerSystemConnector } from "trm-core";
import { getRoamingFolder } from "../utils";
import path from "path";
import * as fs from "fs";
import * as ini from "ini";
import { SystemAliasData } from "./SystemAliasData";

const SYSTEM_FILE_NAME = "systems.ini";

export class SystemAlias {

    constructor(private _connection: Connection, private _login: Login) { }

    public getConnection(): ServerSystemConnector {
        return new ServerSystemConnector(this._connection, this._login);
    }

    private static generateFile(content: SystemAliasData[], filePath?: string): void {
        if(!filePath){
            filePath = this.getSystemAliasFilePath();
        }
        var oContent = {};
        content.forEach(o => {
            oContent[o.alias] = {
                dest: o.connection.dest,
                ashost: o.connection.ashost,
                sysnr: o.connection.sysnr,
                client: o.login.client,
                user: o.login.user,
                passwd: o.login.passwd,
                lang: o.login.lang
            }
        });
        fs.writeFileSync(filePath, ini.encode(oContent), {encoding:'utf8',flag:'w'});
    }

    private static getSystemAliasFilePath(): string {
        const filePath = path.join(getRoamingFolder(), SYSTEM_FILE_NAME);
        if(!fs.existsSync(filePath)){
            this.generateFile([], filePath);
        }
        return filePath;
    }

    public static getAll(): SystemAliasData[] {
        var aAlias: SystemAliasData[] = [];
        const filePath = this.getSystemAliasFilePath();
        const sIni = fs.readFileSync(filePath).toString();
        const oIni = ini.decode(sIni);
        Object.keys(oIni).forEach(sAlias => {
            aAlias.push({
                alias: sAlias,
                connection: {
                    dest: oIni[sAlias].dest,
                    ashost: oIni[sAlias].ashost,
                    sysnr: oIni[sAlias].sysnr,
                    saprouter: oIni[sAlias].saprouter
                },
                login: {
                    client: oIni[sAlias].client,
                    user: oIni[sAlias].user,
                    passwd: oIni[sAlias].passwd,
                    lang: oIni[sAlias].lang
                }
            })
        })
        return aAlias;
    }

    public static get(name: string): SystemAlias {
        const aAlias = this.getAll();
        const alias = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        if(alias){
            return new SystemAlias(alias.connection, alias.login);
        }else{
            throw new Error(`System alias "${name}" not found.`);
        }
    }

    public static create(name: string, connection: Connection, login: Login): SystemAlias {
        if(!name){
            throw new Error(`Invalid alias name.`);
        }
        var aAlias = this.getAll();
        const alreadyExists = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase()) ? true : false;
        if(alreadyExists){
            throw new Error(`Alias already exists. Choose an unique name.`);
        }else{
            aAlias.push({
                alias: name,
                connection,
                login
            });
            this.generateFile(aAlias);
        }
        return new SystemAlias(connection, login);
    }

    public static delete(name: string): void {
        var aAlias = this.getAll();
        aAlias = aAlias.filter(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        this.generateFile(aAlias);
    }
}