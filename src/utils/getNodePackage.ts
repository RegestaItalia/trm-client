import * as fs from "fs";
import path from "path";
import { rootPath } from 'get-root-path';

export function getNodePackage(): any {
    var file: Buffer;
    try{
        file = fs.readFileSync(path.join(rootPath, "/node_modules/trm-client/package.json"));
    }catch(e){
        file = fs.readFileSync(path.join(rootPath, "package.json"));
    }
    const packageData = JSON.parse(file.toString());
    if(packageData.name !== 'trm-client'){
        throw new Error(`package.json not found! -> root path: ${rootPath}`);
    }
    return packageData;
}