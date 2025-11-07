import { Inquirer, Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { connect, createAlias, deleteAlias } from "../prompts";
import { SystemAlias, SystemAliasData } from "../../systemAlias";
import { GlobalContext } from "../../utils";

export class Alias extends AbstractCommand {

    protected init(): void {
        if (this.name.includes('create')) {
            this.command.description(`Create a new system alias.`);
            this.command.argument(`<alias>`, `Alias name.`);
        } else if (this.name.includes('delete')) {
            this.command.description(`Delete a system alias.`);
            this.command.argument(`<alias>`, `Alias name.`);
        } else {
            this.command.description(`List and manage aliases.`);
        }
    }

    private view(alias: SystemAliasData) {
        const connection = GlobalContext.getInstance().getConnections().find(o => o.name === alias.type);
        if (!connection) {
            throw new Error(`Unknown connection type "${alias.type}".`);
        }
        connection.setData(alias.data);
        if (connection.logData) {
            connection.logData();
        } else {
            Logger.info(`No data to show.`);
        }
    }

    private async check(alias: SystemAliasData) {
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

    private async edit(alias: SystemAliasData) {
        var connectionSuccess = true;
        const connectionArgs = await connect({
            ...alias.data,
            ...{
                type: alias.type,
                noSystemAlias: true,
                force: true
            }
        }, false);
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

    protected async handler(): Promise<void> {
        if (this.args.create && this.args.add.trim().toLowerCase() === 'create') {
            await createAlias(this.args.alias);
        } else if (this.args.delete && this.args.rm.trim().toLowerCase() === 'delete') {
            await deleteAlias(this.args.alias);
        } else {
            const aAlias = SystemAlias.getAll();
            const choices = [{
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
            }];
            const inq1 = await Inquirer.prompt({
                name: `action`,
                message: `Action`,
                type: `list`,
                choices
            });
            var aliasPick: SystemAliasData;
            if (inq1.action.startsWith(`pick_`)) {
                aliasPick = (await Inquirer.prompt({
                    name: `aliasPick`,
                    message: `Select system alias`,
                    type: `list`,
                    choices: aAlias.map(o => {
                        return {
                            name: o.alias,
                            value: o
                        }
                    })
                })).aliasPick;
            }
            const action = inq1.action.replace(/^pick_/gmi, '');
            switch (action) {
                case 'create':
                    const newAlias = (await Inquirer.prompt({
                        name: `alias`,
                        message: `New alias name`,
                        type: `input`,
                        validate: (name) => {
                            if (!name) {
                                return 'Cannot create alias with empty name.'
                            }
                            if (aAlias.find(o => o.alias.trim().toUpperCase() === name.trim().toUpperCase())) {
                                return `Alias "${name}" already exists`;
                            } else {
                                return true;
                            }
                        }
                    })).alias;
                    await createAlias(newAlias);
                    break;
                case 'view':
                    this.view(aliasPick);
                    break;
                case 'check':
                    await this.check(aliasPick);
                    break;
                case 'edit':
                    await this.edit(aliasPick);
                    break;
                case 'delete':
                    await deleteAlias(aliasPick.alias);
                    break;
            }
        }
    }

}