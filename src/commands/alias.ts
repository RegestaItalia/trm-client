import { Inquirer, Logger } from "trm-core";
import { SystemAlias, SystemAliasData } from "../systemAlias";
import { AliasArguments, ConnectArguments } from "./arguments";
import { createAlias } from "./createAlias";
import { deleteAlias } from "./deleteAlias";
import { connect } from "./prompts";

const _create = async () => {
    const inq1 = await Inquirer.prompt({
        name: 'name',
        message: 'Alias name',
        type: 'input'
    });
    await createAlias({
        alias: inq1.name
    });
}

const _view = (alias: SystemAliasData) => {
    const dest = alias.connection.dest;
    const ashost = alias.connection.ashost;
    const sysnr = alias.connection.sysnr;
    const saprouter = alias.connection.saprouter;
    const client = alias.login.client;
    const lang = alias.login.lang;
    const user = alias.login.user;
    const hasPassword = alias.login.passwd ? true : false;
    if (dest) {
        Logger.info(`System ID: ${dest}`);
    } else {
        Logger.warning(`System ID: Unknown`);
    }
    if (ashost) {
        Logger.info(`Application server: ${ashost}`);
    } else {
        Logger.warning(`Application server: Unknown`);
    }
    if (sysnr) {
        Logger.info(`Instance number: ${sysnr}`);
    } else {
        Logger.warning(`Instance number: Unknown`);
    }
    if (saprouter) {
        Logger.info(`SAProuter: ${saprouter}`);
    }
    if (client) {
        Logger.info(`Logon client: ${client}`);
    } else {
        Logger.warning(`Logon client: Unknown`);
    }
    if (lang) {
        Logger.info(`Logon language: ${lang}`);
    } else {
        Logger.warning(`Logon language: Unknown`);
    }
    if (user) {
        Logger.info(`Logon user: ${user}`);
    } else {
        Logger.warning(`Logon user: Unknown`);
    }
    if (hasPassword) {
        Logger.info(`Logon password: Saved`);
    } else {
        Logger.warning(`Logon password: Unknown`);
    }
}

const _check = async (alias: SystemAliasData) => {
    Logger.loading(`Checking connection with alias "${alias.alias}"...`);
    const oSystemAlias = new SystemAlias(alias.connection, alias.login);
    try {
        await oSystemAlias.getConnection().connect();
        Logger.success(`Connection OK.`);
    } catch (e) {
        Logger.error(`Connection failed!`);
        Logger.error(e.toString());
    }
}

const _edit = async (alias: SystemAliasData) => {
    var connectionSuccess = true;
    const connectionArgs = await connect({
        ...alias.connection,
        ...alias.login,
        ...{
            noSystemAlias: true
        }
    } as ConnectArguments, false);
    try {
        SystemAlias.delete(alias.alias);
        const updatedAlias = SystemAlias.create(alias.alias, {
            ashost: connectionArgs.ashost,
            dest: connectionArgs.dest,
            sysnr: connectionArgs.sysnr,
            saprouter: connectionArgs.saprouter
        }, {
            client: connectionArgs.client,
            lang: connectionArgs.lang,
            passwd: connectionArgs.passwd,
            user: connectionArgs.user
        });
        await updatedAlias.getConnection().connect();
    } catch (e) {
        connectionSuccess = false;
        throw e;
    } finally {
        if (connectionSuccess) {
            Logger.success(`Alias "${alias.alias}" updated.`);
        } else {
            Logger.error(`Alias "${alias.alias}" couldn't be updated.`);
            SystemAlias.create(alias.alias, {
                ashost: alias.connection.ashost,
                dest: alias.connection.dest,
                sysnr: alias.connection.sysnr,
                saprouter: alias.connection.saprouter
            }, {
                client: alias.login.client,
                lang: alias.login.lang,
                passwd: alias.login.passwd,
                user: alias.login.user
            });
        }
    }
}

const _delete = async (alias: SystemAliasData) => {
    await deleteAlias({
        alias: alias.alias
    });
}

export async function alias(commandArgs: AliasArguments) {
    const aAlias = SystemAlias.getAll();
    var aliasPick: string;
    if (commandArgs.systemAlias) {
        if (!aAlias.find(o => o.alias === commandArgs.systemAlias)) {
            Logger.warning(`Alias "${commandArgs.systemAlias}" not found.`);
        } else {
            aliasPick = commandArgs.systemAlias;
        }
    }
    const inq1 = await Inquirer.prompt({
        name: `action`,
        message: `Action`,
        type: `list`,
        choices: [{
            name: `Create alias`,
            value: `create`
        }, {
            name: `View alias`,
            value: `pick_view`
        }, {
            name: `Check alias connection`,
            value: `pick_check`
        }, {
            name: `Edit alias`,
            value: `pick_edit`
        }, {
            name: `Delete alias`,
            value: `pick_delete`
        }]
    });
    if (inq1.action.startsWith(`pick_`) && !aliasPick) {
        const inq2 = await Inquirer.prompt({
            name: `aliasPick`,
            message: `Select system alias`,
            type: `list`,
            choices: aAlias.map(o => {
                return {
                    name: o.alias,
                    value: o.alias
                }
            })
        });
        aliasPick = inq2.aliasPick;
    }
    const oAliasPick = aAlias.find(o => o.alias === aliasPick);
    const action = inq1.action.replace(/^pick_/gmi, '');
    switch (action) {
        case 'create':
            await _create();
            break;
        case 'view':
            _view(oAliasPick);
            break;
        case 'check':
            await _check(oAliasPick);
            break;
        case 'edit':
            await _edit(oAliasPick);
            break;
        case 'delete':
            await _delete(oAliasPick);
            break;
    }
}