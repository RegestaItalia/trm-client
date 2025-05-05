import { FileSystem, TrmManifestDependency, publish as action } from "trm-core";
import { PackArguments } from "./arguments";
import { getTempFolder } from "../utils";
import { CommandContext } from "./commons";
import { Inquirer, Logger } from "trm-commons";

const _parseDependenciesArg = (arg: string): TrmManifestDependency[] => {
    if(arg){
        try{
            return JSON.parse(arg);
        }catch(e){ }
    }
}

const _parseSapEntriesArg = (arg: string): any => {
    if(arg){
        try{
            return JSON.parse(arg);
        }catch(e){ }
    }
}

const _parseReleaseTimeoutArg = (arg: string): number => {
    if(arg){
        try{
            return parseInt(arg);
        }catch(e){ }
    }
}

export async function pack(commandArgs: PackArguments) {
    var outputPath = commandArgs.outputPath;
    if(!outputPath){
        if(commandArgs.noPrompts){
            throw new Error(`Provide an output path for the file with option -o (--output). Run with option -h (--help) for more information.`);
        }else{
            outputPath = (await Inquirer.prompt({
                message: `Output path`,
                name: 'outputPath',
                type: `input`
            })).outputPath;
        }
    }
    const registry = new FileSystem(outputPath);
    const packages = await CommandContext.getSystemPackages();
    const result = await action({
        contextData: {
            logTemporaryFolder: getTempFolder(),
            systemPackages: packages,
            noInquirer: commandArgs.noPrompts
        },
        packageData: {
            name: commandArgs.package,
            version: commandArgs.version,
            devclass: commandArgs.devclass,
            manifest: {
                authors: commandArgs.authors,
                backwardsCompatible: commandArgs.backwardsCompatible,
                description: commandArgs.description,
                git: commandArgs.git,
                keywords: commandArgs.keywords,
                license: commandArgs.license,
                website: commandArgs.website,
                dependencies: _parseDependenciesArg(commandArgs.dependencies),
                sapEntries: _parseSapEntriesArg(commandArgs.sapEntries)
            },
            registry
        },
        publishData: {
            noLanguageTransport: commandArgs.noLanguageTransport,
            noDependenciesDetection: commandArgs.noDependenciesDetection,
            skipCustomizingTransports: commandArgs.skipCustomizingTransports,
            customizingTransports: commandArgs.customizingTransports
        },
        systemData: {
            releaseTimeout: _parseReleaseTimeoutArg(commandArgs.releaseTimeout),
            transportTarget: commandArgs.transportTarget
        }
    });
    const sOutput = `+ ${result.trmPackage.manifest.get().name} ${result.trmPackage.manifest.get().version} >> ${outputPath}`;
    Logger.success(sOutput);
}