import { TrmManifestDependency, publish as action } from "trm-core";
import { PublishArguments } from "./arguments";
import * as fs from "fs";
import { getTempFolder } from "../utils";
import { CommandContext } from "./commons";
import { Logger } from "trm-commons";

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

const _parseReadmeArg = (arg: string): string => {
    if(arg){
        try{
            return fs.readFileSync(arg).toString();
        }catch(e){
            return arg;
        }
    }
}

const _parseReleaseTimeoutArg = (arg: string): number => {
    if(arg){
        try{
            return parseInt(arg);
        }catch(e){ }
    }
}

export async function publish(commandArgs: PublishArguments) {
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
            registry: CommandContext.getRegistry()
        },
        publishData: {
            private: commandArgs.private,
            keepLatestReleaseManifestValues: commandArgs.keepLatestReleaseManifestValues,
            noLanguageTransport: commandArgs.noLanguageTransport,
            noDependenciesDetection: commandArgs.noDependenciesDetection,
            skipCustomizingTransports: commandArgs.skipCustomizingTransports,
            customizingTransports: commandArgs.customizingTransports,
            readme: _parseReadmeArg(commandArgs.readme)
        },
        systemData: {
            releaseTimeout: _parseReleaseTimeoutArg(commandArgs.releaseTimeout),
            transportTarget: commandArgs.transportTarget
        }
    });
    const sOutput = `+ ${result.trmPackage.manifest.get().name} ${result.trmPackage.manifest.get().version} on ${CommandContext.getRegistry().name}`;
    Logger.success(sOutput);
}