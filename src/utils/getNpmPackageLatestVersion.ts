import axios from "axios";
import { maxSatisfying } from "semver";

export async function getNpmPackageLatestVersion(packageName: string, range?: string): Promise<{ actualLatest: string, latest: string }> {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const actualLatest = response.data['dist-tags'].latest;
    if (!range) {
        return { actualLatest, latest: actualLatest };
    } else {
        return {
            latest: maxSatisfying(Object.keys(response.data.versions || {}), range),
            actualLatest
        }
    }
}