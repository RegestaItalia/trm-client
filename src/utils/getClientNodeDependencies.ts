import { getNodePackage } from "trm-core";

export function getClientNodeDependencies(): {
    [key: string]: string;
} {
    const trmClientPackage = getNodePackage("trm-client");
    return trmClientPackage.dependencies || {};
}