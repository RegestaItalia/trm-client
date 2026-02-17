import { getNodePackage } from "trm-core";

export function getClientVersion(): string {
    const trmClientPackage = getNodePackage("trm-client");
    return trmClientPackage.version;
}