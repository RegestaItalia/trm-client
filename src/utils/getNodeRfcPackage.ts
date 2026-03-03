import { readFileSync } from "fs";
import { join } from "path";
import { GlobalContext } from "./GlobalContext";

export function getNodeRfcPackage() {
    try{
        return JSON.parse(readFileSync(join(GlobalContext.getInstance().getGlobalNodeModules(), `/node-rfc/package.json`)).toString());
    }catch{}
}