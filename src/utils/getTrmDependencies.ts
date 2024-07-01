import { getClientPackage } from "./getClientPackage";

export function getTrmDependencies(): string {
    const trmClientPackage = getClientPackage();
    return trmClientPackage.trmDependencies;
}