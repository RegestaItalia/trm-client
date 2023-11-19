import * as fs from "fs";
import path from "path";
import { rootPath } from 'get-root-path';

export function getClientPackage(): any {
    return JSON.parse(fs.readFileSync(path.join(rootPath, "package.json")).toString());
}