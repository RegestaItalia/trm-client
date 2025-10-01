import { Context, getRoamingFolder } from "../utils";
import path from "path";
import * as fs from "fs";
import * as ini from "ini";
import { SystemAliasData } from "./SystemAliasData";
import { ISystemConnector } from "trm-core";
import { IConnect, Inquirer } from "trm-commons";

const SYSTEM_FILE_NAME = "systems.ini";

export class SystemAlias {

    constructor(public type: string, private _data: any) { }

    public getConnection(): ISystemConnector {
        const connection = Context.getInstance().getConnections().find(o => o.name === this.type);
        if (!connection) {
            throw new Error(`Unknown connection type "${this.type}". Possible values are ${Context.getInstance().getConnections().map(k => k.name).join(', ')}.`);
        }
        connection.setData(this._data);
        return connection.getSystemConnector() as ISystemConnector;
    }

    private static generateFile(content: SystemAliasData[], filePath?: string): void {
        if (!filePath) {
            filePath = this.getSystemAliasFilePath();
        }
        var oContent = {};
        content.forEach(o => {
            const connection = Context.getInstance().getConnections().find(k => k.name === o.type);
            if (connection) {
                oContent[o.alias] = o.data;
                oContent[o.alias].type = o.type;
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
            if (!oIni[sAlias].type) {
                oIni[sAlias].type = 'RFC'; //blank defaults to RFC (for backwards compatibility)
            }
            const connection = Context.getInstance().getConnections().find(o => o.name === oIni[sAlias].type);
            if (connection) {
                connection.setData(oIni[sAlias]);
                aAlias.push({
                    alias: sAlias,
                    type: oIni[sAlias].type,
                    data: connection.getData()
                });
            }
        })
        return aAlias;
    }

    public static get(name: string): SystemAlias {
        const aAlias = this.getAll();
        const alias = aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase());
        if (alias) {
            return new SystemAlias(alias.type, alias);
        } else {
            throw new Error(`System alias "${name}" not found.`);
        }
    }

    public static create(name: string, type: string, data: any): SystemAlias {
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
                data
            });
            this.generateFile(aAlias);
        }
        return new SystemAlias(type, data);
    }

    public static delete(name: string): void {
        var aAlias = this.getAll();
        aAlias = aAlias.filter(o => o.alias.trim().toUpperCase() !== name.trim().toUpperCase());
        this.generateFile(aAlias);
    }

    private static deepEqual(a: any, b: any): boolean {
        if (a === b) return true;

        if (a && b && typeof a === "object" && typeof b === "object") {
            //date
            if (a instanceof Date && b instanceof Date) {
                return a.getTime() === b.getTime();
            }

            //array
            if (Array.isArray(a) && Array.isArray(b)) {
                if (a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) {
                    if (!this.deepEqual(a[i], b[i])) return false;
                }
                return true;
            }

            //object
            if (a.constructor !== b.constructor) return false;

            const keysA = Object.keys(a);
            const keysB = Object.keys(b);

            if (keysA.length !== keysB.length) return false;

            for (const key of keysA) {
                if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
                if (!this.deepEqual(a[key], b[key])) return false;
            }

            return true;
        }

        return false;
    }

    public static compare(a: SystemAlias, b: SystemAlias): boolean {
        if(a.type === b.type){
            return this.deepEqual(a._data, b._data);
        }else{
            return false;
        }
    }

    public static async createIfNotExists(connection: IConnect): Promise<void> {
        const aAlias = this.getAll();
        const parsedData = connection.getData();
        if (!aAlias.find(o => this.deepEqual(o, parsedData))) {
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
            if (aliasName) {
                this.create(aliasName, connection.name, parsedData);
            }
        }
    }
}