import { findNodePackage, getGlobalNodeModulesPaths } from "trm-commons";
import { GlobalContext } from "./GlobalContext";

export function getNodeRfcPackage() {
    // same lookup as the RFC client
    const globalNodeModules = GlobalContext.getInstance().getGlobalNodeModules();
    return findNodePackage("node-rfc", [], {
        globalNodeModulesPaths: globalNodeModules ? [globalNodeModules, ...getGlobalNodeModulesPaths({ npm: false })] : undefined
    })?.packageJson;
}
