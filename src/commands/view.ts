import { ViewArguments } from "./arguments";
import { Logger, SystemConnector, TrmPackage } from "trm-core";
import { CommandRegistry, viewRegistryPackage } from "./commons";
import { eq } from "semver";
import { View } from "trm-registry-types";

type PrintManifest = {
    devclass?: string,
    private: boolean,
    description?: string,
    website?: string,
    git?: string,
    backwardsCompatible?: boolean,
    license?: string,
    authors?: string,
    keywords?: string,
    importTransport?: string,
    workbenchTransport?: string
}

const _printHeaderSection = (packageName: string) => {
    Logger.info(`Package name: ${packageName}`);
    Logger.info(`Registry: ${CommandRegistry.get().name}`);
}

const _printVersionSection = (systemPackage?: TrmPackage, registryView?: View) => {
    if(!systemPackage && !registryView){
        return;
    }
    const oSystemManifest = systemPackage.manifest.get();
    Logger.log(''); //new line
    if(systemPackage){
        Logger.success(`Installed on ${SystemConnector.getDest()}: Yes`);
        Logger.info(`Installed version: ${oSystemManifest.version}`);
    }else{
        Logger.info(`Installed on ${SystemConnector.getDest()}: No`);
    }
    if(registryView.release){
        Logger.info(`Latest version available: ${registryView.release.version}`);
        if(oSystemManifest){
            if(eq(oSystemManifest.version, registryView.release.version)){
                Logger.success(`Latest version installed: Yes`);
            }else{
                Logger.info(`Latest version installed: No`);
            }
        }
    }
}

const _printManifestSection = (manifest: PrintManifest) => {
    Logger.log(''); //new line
    if(manifest.devclass !== undefined){
        Logger.info(`Devclass (SAP Package): ${manifest.devclass}`);
    }
    if(manifest.importTransport !== undefined){
        Logger.info(`Import transport: ${manifest.importTransport}`);
    }
    if(manifest.workbenchTransport !== undefined){
        Logger.info(`Workbench transport: ${manifest.workbenchTransport}`);
    }
    if(manifest.private !== undefined){
        if(manifest.private){
            Logger.info(`Private: Yes`);
        }else{
            Logger.info(`Private: No`);
        }
    }
    if(manifest.description !== undefined){
        Logger.info(`Short description: ${manifest.description}`);
    }
    if(manifest.backwardsCompatible !== undefined){
        if(manifest.backwardsCompatible){
            Logger.info(`Backwards compatible: Yes`);
        }else{
            Logger.info(`Backwards compatible: No`);
        }
    }
    if(manifest.website !== undefined){
        Logger.info(`Website: ${manifest.website}`);
    }
    if(manifest.git !== undefined){
        Logger.info(`Git: ${manifest.git}`);
    }
    if(manifest.authors !== undefined){
        Logger.info(`Authors: ${manifest.authors}`);
    }
    if(manifest.license !== undefined){
        Logger.info(`License: ${manifest.license}`);
    }
}

export async function view(commandArgs: ViewArguments) {
    const packageName = commandArgs.package;
    const dest = SystemConnector.getDest();

    Logger.loading(`Reading system data...`);
    const aSystemPackages = await SystemConnector.getInstalledPackages(true);
    const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(CommandRegistry.registry));
    const oRegistryView = await viewRegistryPackage(packageName, true);
    var authors: string;
    var keywords: string;
    var printManifest: PrintManifest;
    if(oSystemView){
        if(!oSystemView.manifest){
            throw new Error(`Package "${packageName}" found, but manifest is missing on ${dest}!`);
        }
        const oSystemManifest = oSystemView.manifest.get();
        if(Array.isArray(oSystemManifest.authors)){
            authors = oSystemManifest.authors.join(', ');
        }else{
            authors = oSystemManifest.authors;
        }
        if(Array.isArray(oSystemManifest.keywords)){
            keywords = oSystemManifest.keywords.join(', ');
        }else{
            keywords = oSystemManifest.keywords;
        }
        const importTransport = oSystemView.manifest.getLinkedTransport().trkorr;
        printManifest = {
            devclass: oSystemView.getDevclass(),
            private: oSystemManifest.private,
            description: oSystemManifest.description,
            git: oSystemManifest.git,
            website: oSystemManifest.website,
            backwardsCompatible: oSystemManifest.backwardsCompatible,
            license: oSystemManifest.license,
            authors,
            keywords,
            importTransport
        };
    }else if(oRegistryView){
        printManifest = {
            private: oRegistryView.private,
            description: oRegistryView.shortDescription,
            git: oRegistryView.git,
            website: oRegistryView.website,
            license: oRegistryView.license,
            backwardsCompatible: undefined,
            authors: undefined,
            keywords: undefined
        };
    }else{
        throw new Error(`Package "${packageName}" does not exist or insufficient view permissions.`);
    }

    _printHeaderSection(packageName);
    _printVersionSection(oSystemView, oRegistryView);
    _printManifestSection(printManifest);
}