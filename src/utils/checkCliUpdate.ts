import { diff, gt } from "semver";
import { getClientVersion } from './getClientVersion';
import chalk from 'chalk';
import { getNpmPackageLatestVersion } from './getNpmPackageLatestVersion';
import { Logger } from "trm-commons";
import { Context } from "./Context";

export async function checkCliUpdate(print: boolean): Promise<{
    localVersion: string,
    latestVersion: string
}> {
    try {
        var latestVersion: string;
        const cache = Context.getInstance().getCache().latestVersion;
        if(cache && cache.ts && Date.now() - cache.ts <= 60_000){
            latestVersion = cache.data;
        }else{
            latestVersion = await getNpmPackageLatestVersion('trm-client');
            Context.getInstance().setCache('latestVersion', latestVersion);
        }
        const localVersion = getClientVersion();
        const versionDiff = diff(localVersion, latestVersion);
        if ((versionDiff === 'minor' || versionDiff === 'major') && gt(latestVersion, localVersion)) {
            if (print) {
                Logger.warning(`A newer release of trm-client (v${chalk.bold(latestVersion)}) is available.`);
                Logger.warning(`New releases can introduce features and bug fixes.`);
                Logger.warning(`It is recommended to update your client by running the command`);
                Logger.warning(`    ${chalk.bold('trm update')})`);
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