import axios from "axios";
export async function getNpmPackageLatestVersion(packageName: string): Promise<string> {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    return response.data['dist-tags'].latest;
}