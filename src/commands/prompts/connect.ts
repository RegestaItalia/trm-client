import { RESTConnection, RFCConnection } from "trm-core";
import { SystemAlias } from "../../systemAlias";
import { getSapLogonConnections, getSystemConnector, NoConnection, SystemConnectorType } from "../../utils";
import { ConnectArguments } from "../arguments";
import normalizeUrl from "@esm2cjs/normalize-url";
import { Inquirer } from "trm-commons";

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

const _createAliasIfNotExists = () => {

}

export async function connect(commandArgs: ConnectArguments, createAliasIfNotExist: boolean = true, addNoConnection?: boolean): Promise<ConnectArguments> {
    const noSystemAlias = commandArgs.noSystemAlias ? true : false;
    const force = commandArgs.force ? true : false;
    var type = commandArgs.type;
    var aInputType = [];
    var aSapLogonConnections;
    const aAlias = SystemAlias.getAll();
    try{
        aSapLogonConnections = await getSapLogonConnections();
    }catch(e){
        aSapLogonConnections = [];
    }
    if(addNoConnection){
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
        value: 'input', name: 'Manual input'
    });
    if (aSapLogonConnections.length > 0) {
        aInputType.push({
            value: 'logon', name: 'SAP Logon Connection (Uses node-rfc)'
        });
    }

    var result: ConnectArguments;
    var inputType: string;
    if (!commandArgs.ashost && !commandArgs.dest && !commandArgs.sysnr) {
        const inq1 = await Inquirer.prompt({
            type: `list`,
            name: `inputType`,
            message: `Select connection type`,
            choices: aInputType
        });
        inputType = inq1.inputType;
    } else {
        inputType = 'input';
    }

    if (inputType === 'none'){
        return {
            connection: new NoConnection()
        };
    }else if (inputType === 'alias') {
        const inq2 = await Inquirer.prompt({
            type: `list`,
            name: `aliasName`,
            message: `Select alias`,
            choices: aAlias.map(o => {
                return {
                    value: o.alias, name: o.alias
                }
            })
        });
        const alias = aAlias.find(o => o.alias === inq2.aliasName);
        result = { ...alias.connection, ...alias.login };
        type = alias.type;
        createAliasIfNotExist = false; //force to false
    } else {
        if (inputType === 'logon') {
            const inq3 = await Inquirer.prompt({
                type: `list`,
                name: `logonConnection`,
                message: `Select connection`,
                choices: aSapLogonConnections.map(o => {
                    return {
                        value: o.id, name: o.name
                    }
                })
            });
            const logonConnection = aSapLogonConnections.find(o => o.id === inq3.logonConnection);
            commandArgs.ashost = logonConnection.ashost;
            commandArgs.dest = logonConnection.dest;
            commandArgs.sysnr = logonConnection.sysnr;
            commandArgs.saprouter = logonConnection.saprouter;
            type = SystemConnectorType.RFC;
        }else{
            type = commandArgs.type;
        }
        result = await Inquirer.prompt([{
            type: `list`,
            name: `type`,
            message: `Connection type`,
            choices: [{
                value: 'REST',
                name: 'REST (Requires trm-rest)'
            }, {
                value: 'RFC',
                name: 'RFC (Uses node-rfc)'
            }],
            when: (type ? false : true) || force
        },
        //REST
        {
            type: `input`,
            name: `endpoint`,
            message: `System endpoint`,
            default: commandArgs.endpoint,
            when: (hash) => {
                return hash.type === 'REST' && ((commandArgs.endpoint ? false : true) || force)
            }
        }, {
            type: `input`,
            name: `forwardRfcDest`,
            message: `Forward RFC Destination`,
            default: commandArgs.forwardRfcDest,
            when: (hash) => {
                return hash.type === 'REST' && (commandArgs.forwardRfcDest || force)
            }
        },
        //RFC
        {
            type: `input`,
            name: `ashost`,
            message: `Application server`,
            default: commandArgs.ashost,
            when: (hash) => {
                return hash.type === 'RFC' && ((commandArgs.ashost ? false : true) || force)
            }
        }, {
            type: `input`,
            name: `dest`,
            message: `System ID`,
            default: commandArgs.dest,
            when: (hash) => {
                return hash.type === 'RFC' && ((commandArgs.dest ? false : true) || force)
            }
        }, {
            type: `input`,
            name: `sysnr`,
            message: `Instance number`,
            default: commandArgs.sysnr,
            when: (hash) => {
                return hash.type === 'RFC' && ((commandArgs.sysnr ? false : true) || force)
            }
        }, {
            type: `input`,
            name: `saprouter`,
            message: `SAProuter`,
            default: commandArgs.saprouter,
            when: (hash) => {
                return hash.type === 'RFC' && ((commandArgs.saprouter ? false : true) || force)
            }
        }, {
            type: `input`,
            name: `client`,
            message: `Logon Client`,
            default: commandArgs.client,
            when: (hash) => {
                return ( hash.type === 'RFC' || inputType === 'logon' ) && ((commandArgs.client ? false : true) || force)
            }
        }, {
            type: `input`,
            name: `user`,
            message: `Logon User`,
            default: commandArgs.user,
            when: (hash) => {
                return (commandArgs.user ? false : true) || force
            }
        }, {
            type: `password`,
            name: `passwd`,
            message: `Logon Password`,
            default: commandArgs.passwd,
            when: (hash) => {
                return (commandArgs.passwd ? false : true) || force
            }
        }, {
            type: `list`,
            name: `lang`,
            message: `Logon Language`,
            default: commandArgs.lang || 'EN', //default to english
            when: (hash) => {
                return (commandArgs.lang ? false : true) || force
            },
            validate: (input) => {
                return languageList.includes(input.trim().toUpperCase());
            },
            choices: languageList
        }]);
    }

    result.type = result.type || type;
    result.user = result.user || commandArgs.user;
    result.passwd = result.passwd || commandArgs.passwd;
    result.lang = result.lang || commandArgs.lang;
    result.user = result.user.toUpperCase();
    result.lang = result.lang.toUpperCase();

    if(result.type === SystemConnectorType.RFC){
        result.ashost = result.ashost || commandArgs.ashost;
        result.dest = result.dest || commandArgs.dest;
        result.saprouter = result.saprouter || commandArgs.saprouter;
        result.sysnr = result.sysnr || commandArgs.sysnr;
        result.client = result.client || commandArgs.client;
        result.noSystemAlias = commandArgs.noSystemAlias;
    
        result.dest = result.dest.toUpperCase();
        
        result.connection = getSystemConnector(SystemConnectorType.RFC, {
            connection: {
                dest: result.dest,
                ashost: result.ashost,
                sysnr: result.sysnr,
                saprouter: result.saprouter
            } as RFCConnection,
            login: {
                user: result.user,
                passwd: result.passwd,
                lang: result.lang,
                client: result.client
            }
        });
    }else if(result.type === SystemConnectorType.REST){
        result.endpoint = result.endpoint || commandArgs.endpoint;
        result.forwardRfcDest = result.forwardRfcDest || commandArgs.forwardRfcDest;

        if(result.forwardRfcDest){
            result.forwardRfcDest = result.forwardRfcDest.toUpperCase();
        }
        result.endpoint = normalizeUrl(result.endpoint, {
            removeTrailingSlash: true
        });

        result.connection = getSystemConnector(SystemConnectorType.REST, {
            connection: {
                endpoint: result.endpoint,
                rfcdest: result.forwardRfcDest || 'NONE'
            } as RESTConnection,
            login: {
                user: result.user,
                passwd: result.passwd,
                lang: result.lang
            }
        });
    }else{
        throw new Error(`Unknown connection type "${result.type}".`);
    }

    if(createAliasIfNotExist){
        await SystemAlias.createIfNotExists(result);
    }

    return result;
}