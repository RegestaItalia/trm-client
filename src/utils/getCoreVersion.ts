import { getNodePackage } from "trm-core";
import { GlobalContext } from "./GlobalContext";

export function getCoreVersion(): string {
    const trmCorePackage = getNodePackage(GlobalContext.getInstance().getGlobalNodeModules());
    return trmCorePackage.version;
}