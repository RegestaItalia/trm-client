import { getInstalledPackage } from "./getInstalledPackage";

export function getClientVersion(): string {
    const trmClientPackage = getInstalledPackage("trm-client");
    if (!trmClientPackage) {
        throw new Error(`Couldn't find "trm-client" package.json!`);
    }
    return trmClientPackage.version;
}
