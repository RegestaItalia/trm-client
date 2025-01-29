import { Logger } from 'trm-core';
import * as getLatestVersion from 'get-latest-version';
import { diff, gt } from "semver";
import { getClientVersion } from './getClientVersion';
import chalk from 'chalk';

export async function checkCliUpdate(print: boolean): Promise<{
    newRelease: boolean,
    version: string
}> {
    try {
        const latestVersion = await getLatestVersion.default('trm-client');
        const localVersion = getClientVersion();
        const versionDiff = diff(localVersion, latestVersion);
        var newRelease = false;
        if ((versionDiff === 'minor' || versionDiff === 'major') && gt(latestVersion, localVersion)) {
            if (print) {
                Logger.warning(`A newer release of trm-client (v${chalk.bold(latestVersion)}) is available.`);
                Logger.warning(`New releases can introduce features and bug fixes.`);
                Logger.warning(`It is recommended to update your client by running the command`);
                Logger.warning(`    npm update trm-client --global`);
                Logger.warning(` `);
            }
            newRelease = true;
        }
        return {
            newRelease,
            version: latestVersion
        }
    } catch (e) {
        Logger.error(e, true);
    }
}