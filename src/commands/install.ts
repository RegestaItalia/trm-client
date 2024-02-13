import { install as action } from "trm-core";
import { ActionArguments, InstallArguments } from "./arguments";
import * as fs from "fs";

export async function install(commandArgs: InstallArguments, actionArgs: ActionArguments) {
    const inquirer = actionArgs.inquirer;
    const system = actionArgs.system;
    const registry = actionArgs.registry;
    const logger = actionArgs.logger;

    const packageName = commandArgs.package;
    const packageVersion = commandArgs.version || 'latest';
    const forceInstall = commandArgs.force;
    const safe = commandArgs.safe;
    const ignoreSapEntries = commandArgs.ignoreSapEntries;
    const skipDependencies = commandArgs.skipDependencies;
    const skipLang = commandArgs.skipLang;
    const keepOriginalPackages = commandArgs.keepOriginalPackages;
    const skipWorkbenchTransport = commandArgs.skipWorkbenchTransport;
    const targetSystem = commandArgs.targetSystem;
    const transportLayer = commandArgs.transportLayer;
    const ci = commandArgs.ci;
    var importTimeout;
    try{
        importTimeout = parseInt(commandArgs.importTimeout);
    }catch(e){
        importTimeout = 180;
    }

    var packageReplacements;
    var inputPackageReplacementsArg = commandArgs.packageReplacements;
    if (inputPackageReplacementsArg) {
        //this could be the json file path or the json itself
        inputPackageReplacementsArg = inputPackageReplacementsArg.trim();
        var sInputPackageReplacements;
        if (inputPackageReplacementsArg[0] === '{') {
            sInputPackageReplacements = inputPackageReplacementsArg;
        } else {
            sInputPackageReplacements = fs.readFileSync(inputPackageReplacementsArg);
        }
        try {
            packageReplacements = JSON.parse(sInputPackageReplacements);
            packageReplacements.forEach(o => {
                if(!o.originalDevclass || !o.installDevclass){
                    throw new Error();
                }
            });
        } catch (e) {
            throw new Error('Input package replacements: invalid JSON format.');
        }
    }

    await action({
        packageName,
        version: packageVersion,
        forceInstall,
        safe,
        ci,
        importTimeout,
        ignoreSapEntries,
        keepOriginalPackages,
        packageReplacements,
        skipWbTransport: skipWorkbenchTransport,
        skipDependencies,
        skipLang,
        targetSystem,
        transportLayer
    }, inquirer, system, registry, logger);
}