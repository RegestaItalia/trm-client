import { Logger } from 'trm-core';
import * as getLatestVersion from 'get-latest-version';
import { diff } from "semver";
import { getClientVersion } from './getClientVersion';

export async function checkCliUpdate(logger?: Logger) {
    try {
        const latestVersion = await getLatestVersion.default('trm-client');
        if (logger) {
            const localVersion = getClientVersion();
            const versionDiff = diff(localVersion, latestVersion);
            if(versionDiff === 'minor' || versionDiff === 'major'){
                logger.warning(`A newer version of trm-client (v${latestVersion}) is available.`);
                logger.warning(`New versions can introduce features and bug fixes.`);
                logger.warning(`It is recommended to update your client by running the command`);
                logger.warning(`    npm update trm-client --global`);
                logger.warning(` `);
            }
        }
        return latestVersion;
    } catch (e) {
        return null;
    }
}