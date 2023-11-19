import { Logger } from 'trm-core';
import * as getLatestVersion from 'get-latest-version';
import * as fs from "fs";
import path from "path";
import { rootPath } from 'get-root-path';
import { gt } from "semver";

export async function checkCliUpdate(logger?: Logger) {
    try {
        const latestVersion = await getLatestVersion.default('trm-client');
        if (logger) {
            const trmClientPackage = JSON.parse(fs.readFileSync(path.join(rootPath, "package.json")).toString());
            const localVersion = trmClientPackage.version;
            if(gt(latestVersion, localVersion)){
                logger.warning(`A newer version of trm-client (${latestVersion}) is available.`);
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