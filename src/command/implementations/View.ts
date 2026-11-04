import { Logger } from "trm-commons";
import { PUBLIC_RESERVED_KEYWORD, SystemConnector, Transport, TrmManifest, TrmManifestDependency, TrmPackage } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import chalk from "chalk";
import { Package } from "trm-registry-types";
import { eq } from "semver";
import { RegistryAlias } from "../../registryAlias";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";

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
    transport?: string
}

export class View extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "view",
        command: "view",
        title: "View package",
        group: "package",
        guiRelevant: false,
        description: "Show details of a package installed on a system.",
        longDescription: `Shows details of a package installed on the connected system, compared with the registry (latest version, distribution tags).
To read a package from the registry without a system connection, use "trm show".`,
        icon: "Eye",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name." })
        ],
        options: [],
        requirements: {
            requiresConnection: true,
            requiresRegistry: true,
            ignoreRegistryUnreachable: true
        }
    };
    private printHeaderSection(sapPackage?: string) {
        Logger.info(`Registry: ${this.getRegistry().name}`);
        if (sapPackage) {
            Logger.info(`SAP Package: ${sapPackage}`);
        }
    }

    private printVersionSection(isDirty: boolean, systemPackage: TrmPackage, registryView?: Package) {
        const oSystemManifest: TrmManifest = systemPackage.manifest.get();
        console.log(''); //new line
        Logger.success(`Installed on ${SystemConnector.getDest()}: Yes`);
        console.log(chalk.strikethrough(`Installed version: ${oSystemManifest.version}`));
        if (isDirty) {
            Logger.warning(`${chalk.bold('WARNING')}: Package is flagged as "dirty": one or more objects of the package don't match with release declared in manifest`);
            Logger.warning(`${chalk.bold('WARNING')}: Run command "trm dirty <package>" to see a list of local changes.`);
        }
        if (registryView) {
            if (registryView.dist_tags['latest']) {
                console.log(`Latest version available: ${registryView.dist_tags['latest']}`);
                if (eq(oSystemManifest.version, registryView.dist_tags['latest'])) {
                    Logger.success(`Latest version installed: Yes`);
                } else {
                    Logger.error(`Latest version installed: No`);
                }
            } else {
                console.log(`Latest version available: unknown`);
            }
            const distTags = Object.keys(registryView.dist_tags || {});
            if (distTags.length > 0) {
                console.log(`Distribution tags: ${distTags.map(tag => `${tag}: ${registryView.dist_tags[tag]}`).join(', ')}`);
            }
        }
    }

    private printManifestSection(manifest: PrintManifest) {
        console.log(''); //new line
        if (manifest.transport !== undefined) {
            console.log(`${Transport.getTransportIcon()}  ${manifest.transport}`);
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

    private printDependenciesSection(dependencies: TrmManifestDependency[]) {
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

    protected async handler(): Promise<void> {
        const packageName = this.args.package;
        const dest = SystemConnector.getDest();

        const aSystemPackages = await this.getSystemPackages();
        Logger.loading(`Searching package ${packageName}...`);
        const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(this.getRegistry()));
        if (!oSystemView) {
            throw new Error(`Package "${packageName}" is not installed on ${dest}. Use "trm show ${packageName}" to read it from the registry.`);
        }
        if (!oSystemView.manifest) {
            throw new Error(`Package "${packageName}" found, but manifest is missing on ${dest}!`);
        }
        const oRegistryView = await this.viewRegistryPackage(packageName, true);
        var authors: string;
        var keywords: string;
        var printManifest: PrintManifest;
        var dependencies: TrmManifestDependency[];
        var isDirty: boolean = false;
        isDirty = oSystemView.isDirty();
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
        var transport: string;
        try {
            transport = oSystemView.getTransport().trkorr;
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
            transport
        };

        if (this.setJsonOutput({
            name: packageName,
            registry: this.getRegistry().name,
            distTags: oRegistryView?.dist_tags || {},
            latestVersion: oRegistryView?.dist_tags?.['latest'] || null,
            system: {
                dest,
                installed: true,
                version: oSystemView.manifest.get().version,
                dirty: isDirty
            },
            manifest: printManifest,
            dependencies
        })) {
            return;
        }
        this.printHeaderSection(printManifest.devclass);
        this.printVersionSection(isDirty, oSystemView, oRegistryView);
        this.printManifestSection(printManifest);
        this.printDependenciesSection(dependencies);
    }

}
