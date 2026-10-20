import { getInstalledPackage } from "./getInstalledPackage";

export function getClientNodeDependencies(): {
    [key: string]: string;
} {
    return getInstalledPackage("trm-client")?.dependencies || {};
}
