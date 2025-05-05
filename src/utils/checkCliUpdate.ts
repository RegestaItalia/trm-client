import { diff, gt } from "semver";
import { getClientVersion } from './getClientVersion';
import chalk from 'chalk';
import { getNpmPackageLatestVersion } from './getNpmPackageLatestVersion';
import { Logger } from "trm-commons";

export async function checkCliUpdate(print: boolean): Promise<{
    localVersion: string,
    latestVersion: string
}> {
    try {
        const latestVersion = await getNpmPackageLatestVersion('trm-client');
        const localVersion = getClientVersion();
        const versionDiff = diff(localVersion, latestVersion);
        if ((versionDiff === 'minor' || versionDiff === 'major') && gt(latestVersion, localVersion)) {
            if (print) {
                Logger.warning(`A newer release of trm-client (v${chalk.bold(latestVersion)}) is available.`);
                Logger.warning(`New releases can introduce features and bug fixes.`);
                Logger.warning(`It is recommended to update your client by running the command`);
                Logger.warning(`    npm update trm-client --global`);
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