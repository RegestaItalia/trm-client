import { Inquirer, Logger } from "trm-core";
import { SystemAlias, SystemAliasData } from "../systemAlias";
import { ActionArguments, AliasArguments } from "./arguments";

async function _prompt(inquirer: Inquirer, logger: Logger, aAlias: SystemAliasData[], aliasPick?: string) {
    const inq = await inquirer.prompt([{
        type: 'list',
        name: 'aliasPick',
        message: 'System aliases',
        choices: aAlias.map(o => {
            return {
                name: o.alias,
                value: o.alias
            }
        }),
        when: !aliasPick
    }, {
        type: 'expand',
        name: 'action',
        message: (hash) => {
            if(hash.aliasPick){
                return hash.aliasPick;
            }else{
                return aliasPick;
            }
        },
        choices: [{
            key: 'v',
            name: 'View',
            value: 'VIEW'
        }, {
            key: 'e',
            name: 'Edit',
            value: 'EDIT'
        }, {
            key: 'c',
            name: 'Check connection',
            value: 'CHECK_CONNECTION'
        }, {
            key: 'a',
            name: 'Exit',
            value: 'EXIT'
        }],
        default: 'v',
        expanded: true
    }]);

    aliasPick = inq.aliasPick || aliasPick;
    const oAlias = aAlias.find(o => o.alias === aliasPick);

    if(inq.action === 'VIEW'){
        logger.info(`Alias ${oAlias.alias}`);
        if(oAlias.connection.dest){
            logger.info(`System ID ${oAlias.connection.dest}`);
        }else{
            logger.error(`System ID unknown.`);
        }
        if(oAlias.connection.ashost){
            logger.info(`Application server ${oAlias.connection.ashost}`);
        }else{
            logger.error(`Application server unknown.`);
        }
        if(oAlias.connection.sysnr){
            logger.info(`Instance number ${oAlias.connection.sysnr}`);
        }else{
            logger.error(`Instance number unknown.`);
        }
        if(oAlias.login.client){
            logger.info(`Client ${oAlias.login.client}`);
        }else{
            logger.error(`Client unknown.`);
        }
        if(oAlias.login.lang){
            logger.info(`Logon language ${oAlias.login.lang}`);
        }else{
            logger.warning(`Logon language unknown.`);
        }
        if(oAlias.login.user){
            logger.info(`User ${oAlias.login.user}`);
        }else{
            logger.error(`User unknown.`);
        }
        if(oAlias.login.passwd){
            logger.info(`Password saved`);
        }else{
            logger.error(`Password unknown.`);
        }
    }
    if(inq.action === 'EDIT'){
        logger.info('TODO');
    }
    if(inq.action === 'CHECK_CONNECTION'){
        try{
            await SystemAlias.get(oAlias.alias, logger).getConnection().connect(false);
        }catch(e){
            logger.error('Connection failed.');
        }
    }
    return {
        aliasPick,
        exit: inq.action === 'EXIT'
    }
}

export async function alias(commandArgs: AliasArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const inquirer = actionArgs.inquirer;
    const aAlias = SystemAlias.getAll();
    if (aAlias.length === 0) {
        logger.info('There are no system aliases saved.');
        return;
    }
    var aliasPick = commandArgs.systemAlias;
    var exit = false;
    while(!exit){
        const promptRes = await _prompt(inquirer, logger, aAlias, aliasPick);
        aliasPick = promptRes.aliasPick;
        exit = promptRes.exit;
    }
}