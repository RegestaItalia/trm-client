import { Logger, TrmManifest, TrmManifestAuthor, publish as action } from "trm-core";
import { PublishArguments } from "./arguments";
import * as fs from "fs";
import { getTempFolder } from "../utils";
import { CommandRegistry } from "./commons";

const _parseManifestArgument = (packageName: string, packageVersion: string, manifestArg: string): TrmManifest => {
    var manifest: TrmManifest = {
        name: packageName,
        version: packageVersion
    }
    if (manifestArg) {
        //this could be the json file path or the json itself
        manifestArg = manifestArg.trim();
        var sInputManifest;
        var oInputManifest;
        if (manifestArg[0] === '{') {
            sInputManifest = manifestArg;
        } else {
            sInputManifest = fs.readFileSync(manifestArg);
        }
        try {
            oInputManifest = JSON.parse(sInputManifest);
        } catch (e) {
            throw new Error('Input manifest: invalid JSON format.');
        }
        if (oInputManifest.private) {
            manifest.private = oInputManifest.private ? true : false;
        }
        if (oInputManifest.backwardsCompatible) {
            manifest.backwardsCompatible = oInputManifest.backwardsCompatible ? true : false;
        }
        if (oInputManifest.description && typeof (oInputManifest.description) === 'string') {
            manifest.description;
        }
        if (oInputManifest.git && typeof (oInputManifest.git) === 'string') {
            manifest.git;
        }
        if (oInputManifest.website && typeof (oInputManifest.website) === 'string') {
            manifest.website;
        }
        if (oInputManifest.license && typeof (oInputManifest.license) === 'string') {
            manifest.license;
        }
        if (oInputManifest.authors) {
            if (typeof (oInputManifest.authors) === 'string') {
                manifest.authors = oInputManifest.authors;
            } else if (Array.isArray(oInputManifest.authors)) {
                manifest.authors = [];
                oInputManifest.authors.forEach(o => {
                    if (o.name || o.email) {
                        (manifest.authors as TrmManifestAuthor[]).push({
                            name: o.name,
                            email: o.email
                        });
                    }
                });
            }
        }
        if (oInputManifest.keywords) {
            if (typeof (oInputManifest.keywords) === 'string') {
                manifest.keywords = oInputManifest.keywords;
            } else if (Array.isArray(oInputManifest.keywords)) {
                manifest.keywords = [];
                oInputManifest.keywords.forEach(o => {
                    if (typeof (o) === 'string') {
                        (manifest.keywords as string[]).push(o);
                    }
                });
            }
        }
        if (oInputManifest.keywords) {
            if (typeof (oInputManifest.keywords) === 'string') {
                manifest.keywords = oInputManifest.keywords;
            } else if (Array.isArray(oInputManifest.keywords)) {
                manifest.keywords = [];
                oInputManifest.keywords.forEach(o => {
                    if (typeof (o) === 'string') {
                        (manifest.keywords as string[]).push(o);
                    }
                });
            }
        }
        if (Array.isArray(oInputManifest.dependencies)) {
            manifest.dependencies = [];
            oInputManifest.dependencies.forEach(o => {
                if (o.name && o.version) {
                    manifest.dependencies.push({
                        name: o.name,
                        version: o.version,
                        registry: o.registry,
                        integrity: o.integrity
                    });
                }
            });
        }
        manifest.sapEntries = oInputManifest.sapEntries || {};
    }
    return manifest;
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

const _parseCustTransportsArg = (arg: string): string[] => {
    if(arg){
        try{
            return arg.split(/\s+/);
        }catch(e){
            return [];
        }
    }
}

export async function publish(commandArgs: PublishArguments) {
    const registry = CommandRegistry.get();
    const packageName = commandArgs.package;
    const packageVersion = commandArgs.version || 'latest';
    const devclass = commandArgs.devclass;
    const target = commandArgs.target;
    const forceManifestInput = commandArgs.forceManifest;
    const skipLang = commandArgs.skipLang;
    const skipCust = commandArgs.skipCustomizing;
    const skipDependencies = commandArgs.skipDependencies;
    var skipEditSapEntries = commandArgs.skipEditSapEntries;
    var skipEditDependencies = commandArgs.skipEditDependencies;
    var skipReadme = commandArgs.skipReadme;
    const silent = commandArgs.silent;
    
    const manifest = _parseManifestArgument(packageName, packageVersion, commandArgs.manifest);
    const readme = _parseReadmeArg(commandArgs.readme);
    const releaseTimeout = _parseReleaseTimeoutArg(commandArgs.releaseTimeout);
    const customizingTransports = _parseCustTransportsArg(commandArgs.customizingTransports);

    const tmpFolder = getTempFolder();
    
    const output = await action({
        package: manifest,
        registry,
        devclass,
        target,
        forceManifestInput,
        customizingTransports,
        releaseTimeout,
        readme,
        skipCust,
        skipDependencies,
        skipEditDependencies,
        skipEditSapEntries,
        skipLang,
        skipReadme,
        tmpFolder,
        silent
    });
    const sOutput = `+ ${output.manifest.get().name} ${output.manifest.get().version} on ${registry.name}`;
    Logger.success(sOutput);
}