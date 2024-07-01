import { getClientPackage } from "./getClientPackage";

export function getClientDependencies(): string {
    const trmClientPackage = getClientPackage();
    return trmClientPackage.dependencies;
}