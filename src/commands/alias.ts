import { SystemAlias, SystemAliasData } from "../systemAlias";
import { Context } from "../utils";
import { AliasArguments, ConnectArguments } from "./arguments";
import { createAlias } from "./createAlias";
import { deleteAlias } from "./deleteAlias";
import { connect } from "./prompts";
import { Inquirer, Logger } from "trm-commons";

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
    const connection = Context.getInstance().connections.find(o => o.name === alias.type);
    if(!connection){
        throw new Error(`Unknown connection type "${alias.type}".`);
    }
    connection.setData(alias.data);
    if(connection.logData){
        connection.logData();
    }else{
        Logger.info(`No data to show.`);
    }
}

const _check = async (alias: SystemAliasData) => {
    Logger.loading(`Checking connection with alias "${alias.alias}"...`);
    const oSystemAlias = new SystemAlias(alias.type, alias.data);
    try {
        await oSystemAlias.getConnection().connect();
        Logger.success(`Connection to alias "${alias.alias}" OK.`);
    } catch (e) {
        Logger.error(`Connection failed!`);
        Logger.error(e.toString());
    }
}

const _edit = async (alias: SystemAliasData) => {
    var connectionSuccess = true;
    const connectionArgs = await connect({
        ...alias.data,
        ...{
            type: alias.type,
            noSystemAlias: true,
            force: true
        }
    } as ConnectArguments, false);
    const newData = connectionArgs.getData();
    try {
        SystemAlias.delete(alias.alias);
        await SystemAlias.create(alias.alias, connectionArgs.name, newData).getConnection().connect();
    } catch (e) {
        connectionSuccess = false;
        throw e;
    } finally {
        if (connectionSuccess) {
            Logger.success(`Alias "${alias.alias}" updated.`);
        } else {
            Logger.error(`Alias "${alias.alias}" couldn't be updated.`);
            SystemAlias.delete(alias.alias);
            SystemAlias.create(alias.alias, alias.type, alias.data);
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
    var aliasPick: string = '';
    var inq1Choices = [];
    if (commandArgs.alias) {
        if (!aAlias.find(o => o.alias === commandArgs.alias)) {
            Logger.warning(`Alias "${commandArgs.alias}" not found.`);
            inq1Choices.push({
                name: `Create alias`,
                value: `create`
            });
        } else {
            aliasPick = commandArgs.alias;
        }
    }
    inq1Choices = inq1Choices.concat([{
        name: aliasPick ? `View "${aliasPick}"` : `View alias`,
        value: `pick_view`
    }, {
        name: aliasPick ? `Check "${aliasPick}" connection` : `Check alias connection`,
        value: `pick_check`
    }, {
        name: aliasPick ? `Edit "${aliasPick}"` : `Edit alias`,
        value: `pick_edit`
    }, {
        name: aliasPick ? `Delete "${aliasPick}"` : `Delete alias`,
        value: `pick_delete`
    }]);
    const inq1 = await Inquirer.prompt({
        name: `action`,
        message: `Action`,
        type: `list`,
        choices: inq1Choices
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