import { getInstalledPackage } from "./getInstalledPackage";

export function getCoreVersion(): string {
    return getInstalledPackage("trm-core")?.version;
}
