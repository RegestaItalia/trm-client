import { SystemAlias } from "../../systemAlias";
import { GlobalContext, DummyConnector, getSapLogonConnections } from "../../utils";
import { IConnect, Inquirer } from "trm-commons";
import { isEqual } from "lodash";
import { ISystemConnector } from "trm-core";

export type ConnectArguments = {
    type?: string,
    dest?: string,
    ashost?: string,
    sysnr?: string,
    saprouter?: string,
    client?: string,
    user?: string,
    passwd?: string,
    lang?: string,
    noSystemAlias?: boolean,
    force?: boolean,
    endpoint?: string,
    forwardRfcDest?: string,
    connection?: ISystemConnector
}

const languageList = [
    { value: 'AR', name: 'AR (Arabic)' },
    { value: 'BG', name: 'BG (Bulgarian)' },
    { value: 'CA', name: 'CA (Catalan)' },
    { value: 'ZH', name: 'ZH (Chinese, simplified)' },
    { value: 'ZT', name: 'ZT (Chinese, traditional)' },
    { value: 'HR', name: 'HR (Croatian)' },
    { value: 'CS', name: 'CS (Czech)' },
    { value: 'DA', name: 'DA (Danish)' },
    { value: 'NL', name: 'NL (Dutch)' },
    { value: 'EN', name: 'EN (English)' },
    { value: 'ET', name: 'ET (Estonian)' },
    { value: 'FI', name: 'FI (Finnish)' },
    { value: 'FR', name: 'FR (French)' },
    { value: 'DE', name: 'DE (German)' },
    { value: 'EL', name: 'EL (Greek)' },
    { value: 'HE', name: 'HE (Hebrew)' },
    { value: 'HI', name: 'HI (Hindi)' },
    { value: 'HU', name: 'HU (Hungarian)' },
    { value: 'IT', name: 'IT (Italian)' },
    { value: 'JA', name: 'JA (Japanese)' },
    { value: 'KK', name: 'KK (Kazakh)' },
    { value: 'KO', name: 'KO (Korean)' },
    { value: 'LV', name: 'LV (Latvian)' },
    { value: 'LT', name: 'LT (Lithuanian)' },
    { value: 'MS', name: 'MS (Malay)' },
    { value: 'NO', name: 'NO (Norwegian)' },
    { value: 'PL', name: 'PL (Polish)' },
    { value: 'PT', name: 'PT (Portuguese)' },
    { value: 'RO', name: 'RO (Romanian)' },
    { value: 'RU', name: 'RU (Russian)' },
    { value: 'SH', name: 'SH (Serbian, Latin)' },
    { value: 'SK', name: 'SK (Slovak)' },
    { value: 'SL', name: 'SL (Slovenian)' },
    { value: 'ES', name: 'ES (Spanish)' },
    { value: 'SV', name: 'SV (Swedish)' },
    { value: 'TH', name: 'TH (Thai)' },
    { value: 'TR', name: 'TR (Turkish)' },
    { value: 'UK', name: 'UK (Ukrainian)' },
    { value: 'VI', name: 'VI (Vietnamese)' }
];

class NoConnection implements IConnect {
    name = null;
    description = 'No connection';
    loginData = false;
    getData: () => any;
    setData: (data: any) => void;
    getSystemConnector(): DummyConnector {
        return new DummyConnector();
    }
}

export async function connect(commandArgs: ConnectArguments, createAliasIfNotExist: boolean = true, addNoConnection?: boolean): Promise<IConnect> {
    const noSystemAlias = commandArgs.noSystemAlias ? true : false;
    const force = commandArgs.force ? true : false;
    var type = commandArgs.type;
    var aInputType = [];
    var aSapLogonConnections;
    const aAlias = SystemAlias.getAll();
    try {
        aSapLogonConnections = await getSapLogonConnections();
    } catch (e) {
        aSapLogonConnections = [];
    }
    if (addNoConnection) {
        aInputType.push({
            value: 'none', name: 'No connection'
        });
    }
    if (aAlias.length > 0 && !noSystemAlias) {
        aInputType.push({
            value: 'alias', name: 'System Alias'
        });
    }
    aInputType.push({
        value: null, name: 'Manual input'
    });
    if (aSapLogonConnections.length > 0) {
        aInputType.push({
            value: 'logon', name: 'SAP Logon Connection (Uses node-rfc)'
        });
    }

    var inputType: string;
    if (!commandArgs.type) {
        const inq1 = await Inquirer.prompt({
            type: `list`,
            name: `inputType`,
            message: `Select connection type`,
            choices: aInputType
        });
        inputType = inq1.inputType;
    }

    if (inputType === 'none') {
        return new NoConnection();
    } else if (inputType === 'alias') {
        const inq2 = (await Inquirer.prompt({
            type: `list`,
            name: `alias`,
            message: `Select alias`,
            choices: aAlias.map(o => {
                return {
                    value: o, name: o.alias
                }
            })
        })).alias;
        const connection = GlobalContext.getInstance().getConnections().find(o => o.name === inq2.type);
        if (!connection) {
            throw new Error(`Unknown connection type "${inq2.type}" in alias "${inq2.name}"`);
        }
        connection.setData(inq2.data);
        if (connection.onAfterLoginData) {
            await connection.onAfterLoginData(force, commandArgs);
        }
        //check for changes to login data and update alias
        if(!isEqual(inq2.data, connection.getData())){
            SystemAlias.delete(inq2.alias);
            SystemAlias.create(inq2.alias, inq2.type, connection.getData());
        }
        return connection;
    } else {
        if (inputType === 'logon') {
            const logonConnection = (await Inquirer.prompt({
                type: `list`,
                name: `data`,
                message: `Select connection`,
                choices: aSapLogonConnections.map(o => {
                    return {
                        value: o, name: o.name
                    }
                })
            })).data;
            commandArgs.ashost = logonConnection.ashost;
            commandArgs.dest = logonConnection.dest;
            commandArgs.sysnr = logonConnection.sysnr;
            commandArgs.saprouter = logonConnection.saprouter || ' '; //passing default blank string to avoid asking saprouter again in inquirer
            type = 'RFC'; //force to rfc
        }

        if (!type || force) {
            type = (await Inquirer.prompt({
                type: `list`,
                name: `type`,
                message: `Connection type`,
                choices: GlobalContext.getInstance().getConnections().map(o => {
                    return {
                        name: o.description,
                        value: o.name
                    }
                })
            })).type;
        }
        const connectionType = GlobalContext.getInstance().getConnections().find(o => o.name === type);
        if (!connectionType) {
            throw new Error(`Invalid connection type "${type}"`);
        }
        if (connectionType.onConnectionData) {
            await connectionType.onConnectionData(force, commandArgs);
        }
        if (connectionType.loginData) {
            commandArgs = {
                ...commandArgs, ...(await Inquirer.prompt([
                    {
                        type: `input`,
                        name: `client`,
                        message: `Logon Client`,
                        default: commandArgs.client,
                        when: (hash) => {
                            return (commandArgs.client ? false : true) || force;
                        },
                        validate: (val) => {
                            if (val && /^\d{3}$/.test(val)) {
                                return true;
                            } else {
                                return `Invalid input: expected length 3, only numbers allowed`;
                            }
                        }
                    }, {
                        type: `input`,
                        name: `user`,
                        message: `Logon User`,
                        default: commandArgs.user,
                        when: (hash) => {
                            return (commandArgs.user ? false : true) || force;
                        }
                    }, {
                        type: `password`,
                        name: `passwd`,
                        message: `Logon Password`,
                        default: commandArgs.passwd,
                        when: (hash) => {
                            return (commandArgs.passwd ? false : true) || force;
                        }
                    }, {
                        type: `list`,
                        name: `lang`,
                        message: `Logon Language`,
                        default: commandArgs.lang || 'EN', //default to english
                        when: (hash) => {
                            return (commandArgs.lang ? false : true) || force;
                        },
                        validate: (input) => {
                            return languageList.find(o => o.value === input.trim().toUpperCase()) ? true : `Unknown language "${input}".`
                        },
                        choices: languageList
                    }
                ]))
            };
        }
        if (connectionType.onAfterLoginData) {
            await connectionType.onAfterLoginData(force, commandArgs);
        }
        if (createAliasIfNotExist) {
            await SystemAlias.createIfNotExists(connectionType);
        }
        return connectionType;
    }
}