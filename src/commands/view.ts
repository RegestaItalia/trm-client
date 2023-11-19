import { View } from "trm-registry-types";
import { ActionArguments, ViewArguments } from "./arguments";
import { TrmManifest, TrmPackage, checkSapEntries } from "trm-core";
import { viewRegistryPackage } from "./commons";

export async function view(commandArgs: ViewArguments, actionArgs: ActionArguments) {
    const inquirer = actionArgs.inquirer;
    const system = actionArgs.system;
    const registry = actionArgs.registry;
    const logger = actionArgs.logger;

    const packageName = commandArgs.package;

    logger.loading(`Reading system data...`);
    const aSystemPackages = await system.getInstalledPackages(false);
    const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(registry));
    var oSystemViewManifest: TrmManifest;
    try {
        oSystemViewManifest = oSystemView.manifest.get(true);
    } catch (e) { }
    
    const oRegistryView = await viewRegistryPackage(registry, packageName, logger);


    var linkedTransport: string;
    var devclass: string;
    var backwardsCompatible: boolean;
    var shortDescription: string;
    var git: string;
    var website: string;
    var license: string;
    var authors: string;
    var keywords: string;
    var sapEntries: any;

    try{
        linkedTransport = oSystemViewManifest ? oSystemViewManifest.linkedTransport.trkorr : undefined;
    }catch(e){ }
    try{
        devclass = await oSystemViewManifest.linkedTransport.getDevclass();
    }catch(e){ }
    try{
        backwardsCompatible = oSystemViewManifest ? oSystemViewManifest.backwardsCompatible : undefined; //TODO fix registry doesn't return this info
    }catch(e){ }
    try{
        shortDescription = oSystemViewManifest ? oSystemViewManifest.description : oRegistryView.shortDescription;
    }catch(e){ }
    try{
        git = oSystemViewManifest ? oSystemViewManifest.git : oRegistryView.git;
    }catch(e){ }
    try{
        website = oSystemViewManifest ? oSystemViewManifest.website : oRegistryView.website;
    }catch(e){ }
    try{
        license = oSystemViewManifest ? oSystemViewManifest.license : oRegistryView.license;
    }catch(e){ }
    try{
        sapEntries = oSystemViewManifest ? oSystemViewManifest.sapEntries : [];
    }catch(e){ }


    logger.info(`Package name: ${packageName}`);
    logger.info(`Registry: ${registry.name}`);
    try {
        logger.info(`Latest version: ${oRegistryView.release.version}`);
    } catch (e) {
        logger.warning(`Latest version: Unknown`);
    }
    try {
        logger.info(`${system.getDest()} version: ${oSystemView.manifest.get().version}`);
    } catch (e) {
        logger.error(`${system.getDest()} version: Not installed`);
    }
    if (oRegistryView && oSystemView) {
        try {
            if (oRegistryView.release.version === oSystemView.manifest.get().version) {
                logger.success(`${system.getDest()} has latest version: Yes`);
            } else {
                logger.warning(`${system.getDest()} has latest version: No`);
            }
        } catch (e) {
            logger.error(`${system.getDest()} has latest version: Cannot compare`);
        }
    }
    
    if(devclass){
        logger.info(`Devclass: ${devclass}`);
    }
    if(linkedTransport){
        logger.info(`Transport request: ${linkedTransport}`);
    }
    if(backwardsCompatible !== undefined){
        if(backwardsCompatible){
            logger.success(`Backwards compatible: Yes`);
        }else{
            logger.warning(`Backwards compatible: No`);
        }
    }
    if(shortDescription){
        logger.info(`Description: ${shortDescription}`);
    }
    if(git){
        logger.info(`Git: ${git}`);
    }
    if(website){
        logger.info(`Website: ${website}`);
    }
    if(license){
        logger.info(`License: ${license}`);
    }
    if(authors){
        logger.info(`Authors: ${authors}`);
    }
    if(keywords){
        logger.info(`Keywords: ${keywords}`);
    }

    if(oRegistryView && oRegistryView.userAuthorizations){
        if(oRegistryView.userAuthorizations.canCreateReleases){
            logger.success(`Publish allowed: Yes`);
        }else{
            logger.info(`Publish allowed: No`);
        }
    }

    if(sapEntries){
        logger.loading(`Checking SAP entries...`);
        const sapEntriesCheckResult = await checkSapEntries(sapEntries || {}, system);
        if(sapEntriesCheckResult.missingSapEntries.length === 0){
            logger.success(`SAP entries check OK.`);
        }else{
            logger.error(`Missing ${sapEntriesCheckResult.missingSapEntries.length} SAP entries.`);
        }
    }
}