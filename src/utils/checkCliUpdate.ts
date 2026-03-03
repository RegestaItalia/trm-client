import { diff, gt } from "semver";
import { getClientVersion } from './getClientVersion';
import chalk from 'chalk';
import { Logger } from "trm-commons";
import { GlobalContext } from "./GlobalContext";

export interface CliVersionStatus {
    localVersion: string,
    latestVersion: string
}

export async function checkCliUpdate(print: boolean): Promise<CliVersionStatus> {
    try {
        const latestVersion = GlobalContext.getInstance().getLatestVersion();
        const localVersion = getClientVersion();
        const versionDiff = diff(localVersion, latestVersion);
        if ((versionDiff === 'minor' || versionDiff === 'major') && gt(latestVersion, localVersion)) {
            if (print) {
                Logger.warning(`A new ${chalk.bold(versionDiff)} release of trm-client (v${chalk.bold(latestVersion)}) is available.`);
                Logger.warning(`New releases can introduce features and bug fixes.`);
                Logger.warning(`It is recommended to update your client by running the command`);
                Logger.warning(`    ${chalk.bold('trm update')}`);
                Logger.warning(` `);
            }
        }
        return {
            latestVersion,
            localVersion
        }
    } catch (e) {
        Logger.error(e, true);
    }
}