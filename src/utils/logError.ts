import { Logger, SystemConnector } from "trm-core";
import { inspect } from "util";
import chalk from "chalk";

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
    var sError = originalException.message;
    if(originalException.name === 'TrmRegistryError'){
        if(originalException.status){
            sError = `${chalk.bgRed(originalException.status)} ${sError}`;
        }
    }else if(originalException.name === 'TrmRFCClient') {
        if(originalException.rfcError && originalException.rfcError.key === "TRM_RFC_UNAUTHORIZED"){
            sError += `\n`;
            sError += chalk.bgRed(`User "${SystemConnector.getLogonUser()}" is not authorized to execute TRM RFC functions.`);
        }
    }
    Logger.error(sError);
}