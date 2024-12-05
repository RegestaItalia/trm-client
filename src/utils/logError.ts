import { Logger, SystemConnector } from "trm-core";
import { inspect } from "util";
import chalk from "chalk";
import { parse as htmlParser } from 'node-html-parser';

export async function logError(err: any) {
    var originalException: any;
    if(err.originalException){
        originalException = err;
        while(originalException.originalException){
            Logger.error(inspect(originalException, { breakLength: Infinity, compact: true }), true);
            originalException = originalException.originalException;
        }
    }else{
        Logger.error(inspect(err, { breakLength: Infinity, compact: true }), true);
        originalException = err;
    }
    var sError = (originalException.message || 'Unknown error.').trim();
    var aError = [];
    if(originalException.name === 'ExitPromptError'){
        return;
    }else if(originalException.name === 'TrmRegistryError'){
        if(originalException.status){
            sError = `${chalk.black.bgRed(originalException.status)} ${sError}`;
        }
    }else if(originalException.name === 'TrmRFCClient') {
        if(originalException.rfcError && originalException.rfcError){
            sError = `${chalk.black.bgRed(originalException.rfcError.key)} ${sError}`;
            if(originalException.rfcError.key === "TRM_RFC_UNAUTHORIZED"){
                aError.push(chalk.black.bgRed(`\nUser "${SystemConnector.getLogonUser()}" is not authorized to execute TRM RFC functions. Follow this guide https://docs.trmregistry.com/#/server/docs/setup?id=user-authorization-maintenance.`));
            }
        }
    }else if(originalException.name === 'TrmRestServerError'){
        if(sError[0] === '<'){
            try{
                sError = htmlParser(sError).querySelector('title').innerText;
            }catch(e){ }
        }
        if(originalException.status){
            if(originalException.status === 404){
                aError.push(`Service cannot be reached (Check if trm-rest is installed and activated correctly).`);
            }
            sError = `${chalk.black.bgRed(originalException.status)} ${sError}`;
        }
    }
    aError.push(sError);
    aError.forEach(message => {
        Logger.error(message);
    });
}