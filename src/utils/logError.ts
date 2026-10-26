import { RESTClientError, RFCClientError, SystemConnector } from "trm-core";
import { inspect } from "util";
import chalk from "chalk";
import { Logger } from "trm-commons";

const _getUnauthorizedError = (): string => {
    return `User "${SystemConnector.getLogonUser()}" is not authorized to execute TRM RFC functions. Follow this guide https://docs.trmregistry.com/server/setup/#maintain-authorized-users .`;
}

export async function logError(err: any) {
    var originalException: any;
    var rollbackErrors: string[] = [];
    if (err.originalWorkflowError) {
        // A failed rollback: its own exception is the rollback failure, the cause is the step failure
        Logger.error(inspect(err, { breakLength: Infinity, compact: true }), true);
        rollbackErrors = (err.message || '').split('\n').filter((line: string) => line.startsWith('Additionally, rollback failed:'));
        err = err.originalWorkflowError;
    }
    if (err.originalException) {
        originalException = err;
        while (originalException.originalException) {
            Logger.error(inspect(originalException, { breakLength: Infinity, compact: true }), true);
            originalException = originalException.originalException;
        }
    } else {
        Logger.error(inspect(err, { breakLength: Infinity, compact: true }), true);
        originalException = err;
    }
    var sError = (originalException.message || 'Unknown error.').trim();
    var aError = [];
    if (originalException.name === 'ExitPromptError') {
        Logger.log(`User exited prompt: ${originalException.message}`, true);
        return;
    } else if (originalException.name === 'TrmRegistryV2Error') {
        if (originalException.status) {
            sError = `${chalk.black.bgRed(originalException.status)} ${sError}`;
        }
    } else if (originalException.name === 'TrmRFCClient') {
        const rfcClientError: RFCClientError = originalException;
        if (rfcClientError.exceptionType) {
            if (rfcClientError.exceptionType[0] === 'Z') {
                //z* exceptions are dummy thrown by core, avoid logging key, text is enough
                Logger.error(`${rfcClientError.exceptionType} ${sError}`, true);
            } else {
                sError = `${chalk.black.bgRed(rfcClientError.exceptionType)} ${sError}`;
                if (rfcClientError.exceptionType === "TRM_RFC_UNAUTHORIZED") {
                    sError = chalk.black.bgRed(`${chalk.black.bgRed(rfcClientError.exceptionType)} ${_getUnauthorizedError()}`);
                }
            }
        }
    } else if (originalException.name === 'TrmRESTClient') {
        const restClientError: RESTClientError = originalException;
        if (restClientError.exceptionType == "TRM_RFC_UNAUTHORIZED") {
            aError.push(chalk.black.bgRed(`${chalk.black.bgRed(restClientError.restError.status)} ${_getUnauthorizedError()}`));
        }
        if (restClientError.restError) {
            if (restClientError.restError.status === 404) {
                aError.push(`${chalk.black.bgRed(restClientError.restError.status)} Service cannot be reached (Check if trm-rest is installed and activated correctly).`);
            }
            if (restClientError.restError.status) {
                sError = `${chalk.black.bgRed(restClientError.restError.status)} ${sError}`;
            } else {
                sError = `${sError}`;
            }
        }
    }
    if (sError) {
        Logger.error(sError);
    }
    aError.push(...rollbackErrors);
    aError.forEach(message => {
        if (message) {
            Logger.error(message);
        }
    });
}