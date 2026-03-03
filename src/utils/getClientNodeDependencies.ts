import { getNodePackage } from "trm-core";
import { GlobalContext } from "./GlobalContext";

export function getClientNodeDependencies(): {
    [key: string]: string;
} {
    const trmClientPackage = getNodePackage(GlobalContext.getInstance().getGlobalNodeModules(), "trm-client");
    return trmClientPackage.dependencies || {};
}