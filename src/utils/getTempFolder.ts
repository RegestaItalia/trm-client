import path from "path";
import * as fs from "fs";
import { getRoamingFolder } from "./getRoamingFolder";

export function getTempFolder() {
    const roamingFolder = getRoamingFolder();
    const tempFolder = path.join(roamingFolder, "tmp");
    if(!fs.existsSync(tempFolder)){
        fs.mkdirSync(tempFolder);
    }
    return tempFolder;
}