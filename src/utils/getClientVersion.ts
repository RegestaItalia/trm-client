import { getNodePackage } from "trm-core";
import { GlobalContext } from "./GlobalContext";

export function getClientVersion(): string {
    const trmClientPackage = getNodePackage(GlobalContext.getInstance().getGlobalNodeModules(), "trm-client");
    return trmClientPackage.version;
}