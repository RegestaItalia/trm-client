import { getNodePackage } from "./getNodePackage";

export function getClientVersion(): string {
    const trmClientPackage = getNodePackage();
    return trmClientPackage.version;
}