import { getNodePackage } from "./getNodePackage";

export function getClientNodeDependencies(): {
    [key: string]: string;
} {
    const trmClientPackage = getNodePackage();
    return trmClientPackage.dependencies || {};
}