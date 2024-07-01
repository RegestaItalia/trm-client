import path from "path";
import * as fs from "fs";
import { getRoamingFolder } from "./getRoamingFolder";

export function getLogFolder() {
    const roamingFolder = getRoamingFolder();
    const logFolder = path.join(roamingFolder, "logs");
    if(!fs.existsSync(logFolder)){
        fs.mkdirSync(logFolder);
    }
    return logFolder;
}