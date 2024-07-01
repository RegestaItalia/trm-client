import { Inquirer } from "trm-core";
import { SystemAlias } from "../../systemAlias";
import { getSapLogonConnections } from "../../utils";
import { ConnectArguments } from "../arguments";

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

export async function connect(commandArgs: ConnectArguments, createAliasIfNotExist: boolean = true): Promise<ConnectArguments> {
    const noSystemAlias = commandArgs.noSystemAlias ? true : false;
    const force = commandArgs.force ? true : false;
    var aInputType = [];
    var aSapLogonConnections;
    const aAlias = SystemAlias.getAll();
    try{
        aSapLogonConnections = await getSapLogonConnections();
    }catch(e){
        aSapLogonConnections = [];
    }
    if (aAlias.length > 0 && !noSystemAlias) {
        aInputType.push({
            value: 'alias', name: 'System Alias'
        });
    }
    if (aSapLogonConnections.length > 0) {
        aInputType.push({
            value: 'logon', name: 'SAP Logon Connection'
        });
    }
    aInputType.push({
        value: 'input', name: 'Manual input'
    });

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

    if (inputType === 'alias') {
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
        }
        result = await Inquirer.prompt([{
            type: `input`,
            name: `ashost`,
            message: `Application server`,
            default: commandArgs.ashost,
            when: (commandArgs.ashost ? false : true) || force
        }, {
            type: `input`,
            name: `dest`,
            message: `System ID`,
            default: commandArgs.dest,
            when: (commandArgs.dest ? false : true) || force
        }, {
            type: `input`,
            name: `sysnr`,
            message: `Instance number`,
            default: commandArgs.sysnr,
            when: (commandArgs.sysnr ? false : true) || force
        }, {
            type: `input`,
            name: `saprouter`,
            message: `SAProuter`,
            default: commandArgs.saprouter,
            when: force
        }, {
            type: `input`,
            name: `client`,
            message: `Logon Client`,
            default: commandArgs.client,
            when: (commandArgs.client ? false : true) || force
        }, {
            type: `input`,
            name: `user`,
            message: `Logon User`,
            default: commandArgs.user,
            when: (commandArgs.user ? false : true) || force
        }, {
            type: `password`,
            name: `passwd`,
            message: `Logon Password`,
            default: commandArgs.passwd,
            when: (commandArgs.passwd ? false : true) || force
        }, {
            type: `list`,
            name: `lang`,
            message: `Logon Language`,
            default: commandArgs.lang,
            when: (commandArgs.lang ? false : true) || force,
            validate: (input) => {
                return languageList.includes(input.trim().toUpperCase());
            },
            choices: languageList
        }]);
    }

    result.ashost = result.ashost || commandArgs.ashost;
    result.dest = result.dest || commandArgs.dest;
    result.saprouter = result.saprouter || commandArgs.saprouter;
    result.sysnr = result.sysnr || commandArgs.sysnr;
    result.client = result.client || commandArgs.client;
    result.user = result.user || commandArgs.user;
    result.passwd = result.passwd || commandArgs.passwd;
    result.lang = result.lang || commandArgs.lang;
    result.noSystemAlias = commandArgs.noSystemAlias;

    result.dest = result.dest.toUpperCase();
    result.user = result.user.toUpperCase();
    result.lang = result.lang.toUpperCase();

    /*if(createAliasIfNotExist){
        const aliasExists = aAlias.find(o => {
            return o.connection.ashost.trim().toUpperCase() === result.ashost.trim().toUpperCase() &&
                    o.connection.dest.trim().toUpperCase() === result.dest.trim().toUpperCase() &&
                    o.connection.sysnr.trim().toUpperCase() === result.sysnr.trim().toUpperCase() &&
                    o.login.client.trim().toUpperCase() === result.client.trim().toUpperCase() &&
                    o.login.user.trim().toUpperCase() === result.user.trim().toUpperCase() &&
                    o.login.passwd.trim().toUpperCase() === result.passwd.trim().toUpperCase() &&
                    o.login.lang.trim().toUpperCase() === result.lang.trim().toUpperCase()
        });
        if(!aliasExists){

        }
    }*/
    return result;
}