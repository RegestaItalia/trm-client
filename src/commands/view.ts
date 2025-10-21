import { ViewArguments } from "./arguments";
import { PUBLIC_RESERVED_KEYWORD, SystemConnector, TrmManifest, TrmManifestDependency, TrmPackage } from "trm-core";
import { CommandContext, viewRegistryPackage } from "./commons";
import { eq } from "semver";
import { RegistryAlias } from "../registryAlias";
import chalk from "chalk";
import { Logger } from "trm-commons";
import { DummyConnector } from "../utils";
import { Package } from "trm-registry-types";

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
    Logger.info(`Package name: ${chalk.bold(packageName)}`);
    Logger.info(`Registry: ${CommandContext.getRegistry().name}`);
}

const _printVersionSection = (systemPackage?: TrmPackage, registryView?: Package) => {
    if (!systemPackage && !registryView) {
        return;
    }
    var oSystemManifest: TrmManifest;
    if (!(SystemConnector.systemConnector instanceof DummyConnector)) {
        console.log(''); //new line
        if (systemPackage) {
            oSystemManifest = systemPackage.manifest.get();
            Logger.success(`Installed on ${SystemConnector.getDest()}: Yes`);
            console.log(`Installed version: ${oSystemManifest.version}`);
        } else {
            Logger.error(`Installed on ${SystemConnector.getDest()}: No`);
        }
    }
    if (registryView) {
        console.log(`Latest version available: ${registryView.latest}`);
        if (oSystemManifest) {
            if (eq(oSystemManifest.version, registryView.latest)) {
                Logger.success(`Latest version installed: Yes`);
            } else {
                Logger.error(`Latest version installed: No`);
            }
        }
    }
}

const _printManifestSection = (manifest: PrintManifest) => {
    console.log(''); //new line
    if (manifest.devclass !== undefined) {
        console.log(`SAP Package: ${manifest.devclass}`);
    }
    if (manifest.importTransport !== undefined) {
        console.log(`TRM transport: ${manifest.importTransport}`);
    }
    if (manifest.workbenchTransport !== undefined) {
        console.log(`Landscape transport (Use this to transport in landscape): ${manifest.workbenchTransport}`);
    }
    if (manifest.private !== undefined) {
        if (manifest.private) {
            console.log(`Private: Yes`);
        } else {
            console.log(`Private: No`);
        }
    }
    if (manifest.description !== undefined) {
        console.log(`Short description: ${manifest.description}`);
    }
    if (manifest.backwardsCompatible !== undefined) {
        if (manifest.backwardsCompatible) {
            console.log(`Backwards compatible: Yes`);
        } else {
            console.log(`Backwards compatible: No`);
        }
    }
    if (manifest.website !== undefined) {
        console.log(`Website: ${manifest.website}`);
    }
    if (manifest.git !== undefined) {
        console.log(`Git: ${manifest.git}`);
    }
    if (manifest.authors !== undefined) {
        console.log(`Authors: ${manifest.authors}`);
    }
    if (manifest.license !== undefined) {
        console.log(`License: ${manifest.license}`);
    }
}

const _printDependenciesSection = (dependencies: TrmManifestDependency[]) => {
    if (dependencies.length > 0) {
        console.log(''); //new line
        Logger.info(`This package has a total of ${dependencies.length} dependencies.`);
        const registryAliases = RegistryAlias.getAll();
        const tableHead = [`Name`, `Version`, `Registry`];
        var tableData = [];
        dependencies.forEach(o => {
            const dependencyName = o.name;
            const dependencyVersion = o.version;
            var dependencyRegistry;
            if (!o.registry || o.registry.trim().toLowerCase() === PUBLIC_RESERVED_KEYWORD) {
                dependencyRegistry = PUBLIC_RESERVED_KEYWORD;
            } else {
                const oRegistryAlias = registryAliases.find(k => k.endpointUrl === o.registry);
                if (oRegistryAlias) {
                    dependencyRegistry = oRegistryAlias.alias;
                } else {
                    dependencyRegistry = o.registry;
                }
            }
            tableData.push([
                dependencyName,
                dependencyVersion,
                dependencyRegistry
            ]);
        });
        Logger.table(tableHead, tableData);
    }
}

export async function view(commandArgs: ViewArguments) {
    const packageName = commandArgs.package;
    const dest = SystemConnector.getDest();

    Logger.loading(`Searching package ${packageName}...`);
    const aSystemPackages = await CommandContext.getSystemPackages();
    const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(CommandContext.getRegistry()));
    const oRegistryView = await viewRegistryPackage(packageName, true);
    var authors: string;
    var keywords: string;
    var printManifest: PrintManifest;
    var dependencies: TrmManifestDependency[];
    if (oSystemView) {
        if (!oSystemView.manifest) {
            throw new Error(`Package "${packageName}" found, but manifest is missing on ${dest}!`);
        }
        const oSystemManifest = oSystemView.manifest.get();
        if (Array.isArray(oSystemManifest.authors)) {
            authors = oSystemManifest.authors.map(o => {
                var sAuthor;
                if (o.email) {
                    if (o.name) {
                        sAuthor = `${o.name} <${o.email}>`
                    } else {
                        sAuthor = o.email;
                    }
                } else if (o.name) {
                    sAuthor = o.name;
                } else {
                    return undefined;
                }
                return sAuthor;
            }).join(', ');
        } else {
            authors = oSystemManifest.authors;
        }
        if (Array.isArray(oSystemManifest.keywords)) {
            keywords = oSystemManifest.keywords.join(', ');
        } else {
            keywords = oSystemManifest.keywords;
        }
        var importTransport: string;
        var workbenchTransport: string;
        try {
            importTransport = oSystemView.manifest.getLinkedTransport().trkorr;
        } catch (e) { }
        try {
            workbenchTransport = (await oSystemView.getWbTransport()).trkorr;
        } catch (e) { }
        dependencies = oSystemManifest.dependencies || [];
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
            importTransport,
            workbenchTransport
        };
    } else if (oRegistryView) {
        dependencies = [];
        printManifest = {
            private: oRegistryView.manifest.private,
            description: oRegistryView.manifest.shortDescription,
            git: oRegistryView.manifest.git,
            website: oRegistryView.manifest.website,
            license: oRegistryView.manifest.license
        };
    } else {
        throw new Error(`Package "${packageName}" does not exist or insufficient view permissions.`);
    }

    _printHeaderSection(packageName);
    _printVersionSection(oSystemView, oRegistryView);
    _printManifestSection(printManifest);
    _printDependenciesSection(dependencies);
}