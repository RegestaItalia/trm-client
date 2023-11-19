import { TrmManifest, TrmManifestAuthor, publish as action } from "trm-core";
import { ActionArguments, PublishArguments } from "./arguments";
import * as fs from "fs";
import { getRoamingFolder } from "../utils";

export async function publish(commandArgs: PublishArguments, actionArgs: ActionArguments) {
    const inquirer = actionArgs.inquirer;
    const system = actionArgs.system;
    const registry = actionArgs.registry;
    const logger = actionArgs.logger;

    const packageName = commandArgs.package;
    const packageVersion = commandArgs.version || 'latest';
    const devclass = commandArgs.devclass;
    const target = commandArgs.target;
    const forceManifest = commandArgs.forceManifest;
    const overwriteManifest = commandArgs.overwriteManifest;
    const skipEditSapEntries = commandArgs.skipEditSapEntries;
    const skipEditDependencies = commandArgs.skipEditDependencies;
    const skipReadme = commandArgs.skipReadme;
    const skipDependencies = commandArgs.skipDependencies;
    const ci = commandArgs.ci;
    var releaseTimeout;
    try{
        releaseTimeout = parseInt(commandArgs.releaseTimeout);
    }catch(e){
        releaseTimeout = 180;
    }

    var manifest: TrmManifest = {
        name: packageName,
        version: packageVersion
    }

    var inputManifestArg = commandArgs.manifest;
    if (inputManifestArg) {
        //this could be the json file path or the json itself
        inputManifestArg = inputManifestArg.trim();
        var sInputManifest;
        var oInputManifest;
        if (inputManifestArg[0] === '{') {
            sInputManifest = inputManifestArg;
        } else {
            sInputManifest = fs.readFileSync(inputManifestArg);
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

    var readme;
    if(commandArgs.readme){
        try{
            readme = fs.readFileSync(commandArgs.readme);
        }catch(e){
            readme = commandArgs.readme;
        }
    }
    
    await action({
        package: manifest,
        devclass: devclass,
        target: target,
        forceManifestInput: forceManifest,
        overwriteManifestValues: overwriteManifest,
        skipEditDependencies,
        skipEditSapEntries,
        skipReadme,
        readme,
        ci,
        tmpFolder: getRoamingFolder(),
        skipDependencies,
        releaseTimeout
    }, inquirer, system, registry, logger);
}