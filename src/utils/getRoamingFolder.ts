import path from "path";
import * as fs from "fs";
import { getRoamingPath } from "./getRoamingPath";

export function getRoamingFolder() {
    const roamingPath = getRoamingPath();
    const roamingFolder = path.join(roamingPath, "trm");
    if(!fs.existsSync(roamingFolder)){
        fs.mkdirSync(roamingFolder);
    }
    return roamingFolder;
}