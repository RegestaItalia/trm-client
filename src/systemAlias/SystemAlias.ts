import { getRoamingFolder, getSystemConnector, SystemConnectorType } from "../utils";
import path from "path";
import * as fs from "fs";
import * as ini from "ini";
import { SystemAliasData } from "./SystemAliasData";
import { ISystemConnector, Login, RESTConnection, RFCConnection } from "trm-core";
import { ConnectArguments } from "../commands";
import { Inquirer } from "trm-commons";

const SYSTEM_FILE_NAME = "systems.ini";

export class SystemAlias {

    constructor(public type: SystemConnectorType, private _connection: RFCConnection | RESTConnection, private _login: Login) { }

    public getConnection(): ISystemConnector {
        return getSystemConnector(this.type, {
            connection: this._connection,
            login: this._login
        });
    }

    private static generateFile(content: SystemAliasData[], filePath?: string): void {
        if (!filePath) {
            filePath = this.getSystemAliasFilePath();
        }
        var oContent = {};
        content.forEach(o => {
            if (o.type === SystemConnectorType.RFC) {
                oContent[o.alias] = {
                    type: o.type,
                    dest: (o.connection as RFCConnection).dest,
                    ashost: (o.connection as RFCConnection).ashost,
                    sysnr: (o.connection as RFCConnection).sysnr,
                    client: o.login.client,
                    user: o.login.user,
                    passwd: o.login.passwd,
                    lang: o.login.lang
                };
                if((o.connection as RFCConnection).saprouter){
                    oContent[o.alias].saprouter = (o.connection as RFCConnection).saprouter;
                }
            } else if (o.type === SystemConnectorType.REST) {
                oContent[o.alias] = {
                    type: o.type,
                    endpoint: (o.connection as RESTConnection).endpoint,
                    rfcdest: (o.connection as RESTConnection).rfcdest || 'NONE',
                    client: o.login.client,
                    user: o.login.user,
                    passwd: o.login.passwd,
                    lang: o.login.lang
                };
            }
        });
        fs.writeFileSync(filePath, ini.encode(oContent), { encoding: 'utf8', flag: 'w' });
    }

    private static getSystemAliasFilePath(): string {
        const filePath = path.join(getRoamingFolder(), SYSTEM_FILE_NAME);
        if (!fs.existsSync(filePath)) {
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
            if (oIni[sAlias].type === SystemConnectorType.RFC || !oIni[sAlias].type) { //blank defaults to RFC (for backwards compatibility)
                aAlias.push({
                    alias: sAlias,
                    type: SystemConnectorType.RFC,
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
                });
            } else if (oIni[sAlias].type === SystemConnectorType.REST) {
                aAlias.push({
                    alias: sAlias,
                    type: SystemConnectorType.REST,
                    connection: {
                        endpoint: oIni[sAlias].endpoint,
                        rfcdest: oIni[sAlias].rfcdest || 'NONE'
                    },
                    login: {
                        user: oIni[sAlias].user,
                        passwd: oIni[sAlias].passwd,
                        lang: oIni[sAlias].lang,
                        client: oIni[sAlias].client
                    }
                });
            }
        })
        return aAlias;
    }

    public static get(name: string): SystemAlias {
        const aAlias = this.getAll();
        const alias = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        if (alias) {
            return new SystemAlias(alias.type, alias.connection, alias.login);
        } else {
            throw new Error(`System alias "${name}" not found.`);
        }
    }

    public static create(name: string, type: SystemConnectorType, connection: RFCConnection | RESTConnection, login: Login): SystemAlias {
        if (!name) {
            throw new Error(`Invalid alias name.`);
        }
        var aAlias = this.getAll();
        const alreadyExists = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase()) ? true : false;
        if (alreadyExists) {
            throw new Error(`Alias already exists. Choose an unique name.`);
        } else {
            aAlias.push({
                alias: name,
                type,
                connection,
                login
            });
            this.generateFile(aAlias);
        }
        return new SystemAlias(type, connection, login);
    }

    public static delete(name: string): void {
        var aAlias = this.getAll();
        aAlias = aAlias.filter(o => o.alias.trim().toUpperCase() !== name.trim().toUpperCase());
        this.generateFile(aAlias);
    }

    public static async createIfNotExists(connArgs: ConnectArguments): Promise<void> {
        const aAlias = this.getAll();
        var alias;
        if (connArgs.type === SystemConnectorType.RFC) {
            alias = aAlias.find(o => {
                if (o.type === SystemConnectorType.RFC || !o.type) {
                    const rfcConn = o.connection as RFCConnection;
                    if (rfcConn.dest === connArgs.dest &&
                        rfcConn.ashost === connArgs.ashost &&
                        rfcConn.sysnr === connArgs.sysnr &&
                        rfcConn.saprouter === connArgs.saprouter &&
                        o.login.client === connArgs.client &&
                        o.login.lang === connArgs.lang &&
                        o.login.user === connArgs.user &&
                        o.login.passwd === connArgs.passwd) {
                        return o;
                    }
                }
            });
        } else if (connArgs.type === SystemConnectorType.REST) {
            alias = aAlias.find(o => {
                if (o.type === SystemConnectorType.REST) {
                    const restConn = o.connection as RESTConnection;
                    if (restConn.endpoint === connArgs.endpoint &&
                        restConn.rfcdest === connArgs.forwardRfcDest &&
                        o.login.client === connArgs.client &&
                        o.login.lang === connArgs.lang &&
                        o.login.user === connArgs.user &&
                        o.login.passwd === connArgs.passwd) {
                        return o;
                    }
                }
            });
        }
        if (!alias) {
            const aliasName = (await Inquirer.prompt([{
                name: 'create',
                message: 'Create new alias for connection?',
                type: 'confirm',
                default: true
            }, {
                name: 'alias',
                message: 'Alias name',
                type: 'input',
                when: (hash) => {
                    return hash.create;
                }
            }])).alias;
            if(aliasName){
                this.create(aliasName, connArgs.type, connArgs as any, connArgs as any);
            }
        }
    }
}