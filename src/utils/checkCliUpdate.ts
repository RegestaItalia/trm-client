import { Logger } from 'trm-core';
import * as getLatestVersion from 'get-latest-version';
import { diff } from "semver";
import { getClientVersion } from './getClientVersion';

export async function checkCliUpdate() {
    try {
        const latestVersion = await getLatestVersion.default('trm-client');
        const localVersion = getClientVersion();
        const versionDiff = diff(localVersion, latestVersion);
        if (versionDiff === 'minor' || versionDiff === 'major') {
            Logger.warning(`A newer version of trm-client (v${latestVersion}) is available.`);
            Logger.warning(`New versions can introduce features and bug fixes.`);
            Logger.warning(`It is recommended to update your client by running the command`);
            Logger.warning(`    npm update trm-client --global`);
            Logger.warning(` `);
        }
    } catch (e) {
        Logger.error(e, true);
    }
}