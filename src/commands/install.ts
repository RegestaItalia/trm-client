import { InstallArguments } from "./arguments";
import { InstallPackageReplacements, Logger, install as action } from "trm-core";
import { CommandRegistry } from "./commons";
import * as fs from 'fs';
import { getTempFolder } from "../utils";

const _parsePackageReplacementsArgument = (packageReplacements: string): InstallPackageReplacements[] => {
    var returnValue: InstallPackageReplacements[] = [];
    if (packageReplacements) {
        //this could be the json file path or the json itself
        packageReplacements = packageReplacements.trim();
        var sInput;
        if (packageReplacements[0] === '[') {
            sInput = packageReplacements;
        } else {
            sInput = fs.readFileSync(packageReplacements);
        }
        try {
            returnValue = JSON.parse(sInput);
        } catch (e) {
            throw new Error('Input package replacements map: invalid JSON format.');
        }
    }
    return returnValue;
}

const _parseImportTimeoutArg = (arg: string): number => {
    if(arg){
        try{
            return parseInt(arg);
        }catch(e){ }
    }
}

export async function install(commandArgs: InstallArguments) {
    const registry = CommandRegistry.get();
    const packageName = commandArgs.package;
    const packageVersion = commandArgs.version || 'latest';
    const transportLayer = commandArgs.transportLayer;
    const force = commandArgs.force;
    const keepOriginalDevclass = commandArgs.keepOriginals ? true : false;
    const importTimeout = _parseImportTimeoutArg(commandArgs.importTimeout);
    const generateTransport = commandArgs.workbenchGen;
    const skipSapEntriesCheck = commandArgs.skipSapEntries;
    const skipObjectTypesCheck = commandArgs.skipObjectsCheck;
    const skipLangImport = commandArgs.skipLang;
    const skipCustImport = commandArgs.skipCustomizing;
    const ignoreDependencies = commandArgs.skipDependencies;
    const wbTrTargetSystem = commandArgs.workbenchTarget;
    const silent = commandArgs.silent;
    const packageReplacements = _parsePackageReplacementsArgument(commandArgs.packageReplacements);
    const allowReplace = commandArgs.replaceAllowed;
    
    const tmpFolder = getTempFolder(); 
    const output = await action({
        packageName: packageName,
        registry: registry,
        version: packageVersion,
        r3transOptions: {
            //r3transDirPath: '',
            tempDirPath: tmpFolder
        },
        transportLayer,
        force,
        keepOriginalDevclass,
        importTimeout,
        generateTransport,
        skipSapEntriesCheck,
        skipObjectTypesCheck,
        skipLangImport,
        skipCustImport,
        ignoreDependencies,
        wbTrTargetSystem,
        silent,
        packageReplacements,
        allowReplace
    });
    var sOutput = `${output.trmPackage.packageName} installed`;
    if(output.wbTransport){
        sOutput += `, use ${output.wbTransport} transport.`;
    }else{
        sOutput += `.`;
    }
    Logger.success(sOutput);
}