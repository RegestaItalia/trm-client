import { getClientPackage } from "./getClientPackage";

export function getClientVersion(): string {
    const trmClientPackage = getClientPackage();
    return trmClientPackage.version;
}