import * as getLatestVersion from 'get-latest-version';

export async function getNpmPackageLatestVersion(packageName: string): Promise<string> {
    return await getLatestVersion.default(packageName);
}