import { Inquirer, Logger } from "trm-commons";
import { AbstractRegistry, FileSystem, publish } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { getTempFolder } from "../../utils";
import { ReleaseType, valid } from "semver";

export class Publish extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.requiresTrmDependencies = true;
        if (this.name === 'pack') {
            this.command.description(`Export a package to local file.`);
            this.command.argument(`<filename>`, `Name (or path) of the file.`);
            this.command.option(`--package <package>`, `Name of the package`);
            this.command.option(`--version <version>`, `Version of the release`);
        } else {
            this.registerOpts.requiresRegistry = true;
            this.command.description(`Publish a package to a registry.`);
            this.command.argument(`<package>`, `Name of the package.`);
            this.command.argument(`[version]`, `Optional: Version of the release to publish.`);
            this.command.option(`-i, --increment <increment>`, `Semantic versioning increment (used when no version is specified)`, `patch`);
            this.command.option(`--pre-release`, `Publish as pre release`, false);
            this.command.option(`--pre-release-identifier <identifier>`, `Identifier (needs to pre a pre release)`);
            this.command.option(`--tag <tag>`, `Release tag(s) (separated by comma)`);
            this.command.option(`--private`, `Package marked as private. Depending on the registry, visibility might not be changed after first publish.`);
            this.command.option(`--readme <readme>`, `Release readme (markdown or path to markdown file)`);
            this.command.option(`--no-keep-manifest`, `Don't default to previous release manifest values.`, false);
        }
        this.command.option(`-P, --sap-package <sap package>`, `SAP Package.`);
        this.command.option(`-t, --timeout <seconds>`, `Transport release timeout (in seconds)`, `180`);
        this.command.option(`-T, --target <target>`, `Transport release target.`);
        this.command.option(`--no-lang-tr`, `Do not generate language (translation) transport.`, false);
        this.command.option(`--no-cust-tr`, `Do not generate customizing transport.`, false);
        this.command.option(`--cust <customizing>`, `Customizing transport(s) (separated by comma).`);
        this.command.option(`--no-auto-deps`, `Do not look for dependencies.`, false);
        this.command.option(`--authors <authors>`, `Release author(s) (separated by comma)`);
        this.command.option(`--backwards-compatible`, `Backwards-compatible release (reserved for future use)`);
        this.command.option(`--description <description>`, `Release description`);
        this.command.option(`--git <git url>`, `Release git URL`);
        this.command.option(`--keywords <keywords>`, `Release keyword(s) (separated by comma)`);
        this.command.option(`--license <license>`, `Release license`);
        this.command.option(`--website <website url>`, `Release website URL`);
        this.command.option(`--dependencies <dependencies>`, `Release dependencies (JSON or path to JSON file)`);
        this.command.option(`--sap-entries <sap entries>`, `Release SAP entries (JSON or path to JSON file)`);
        this.command.option(`--post-activities <post activities>`, `Release post activities (JSON or path to JSON file)`);
        this.command.option(`--no-prompts`, `No prompts (will force some decisions).`, false);
    }

    private validateVersion(v: string): true | string {
        if (valid(v)) {
            return true;
        } else {
            return 'Invalid semantic versioning';
        }
    }

    protected async handler(): Promise<void> {
        var registry: AbstractRegistry;
        if (this.name === 'pack') {
            if (!this.args.prompts) {
                const pack = await Inquirer.prompt([{
                    name: 'package',
                    type: 'input',
                    message: 'Package name',
                    default: this.args.package,
                    when: !this.args.package
                }, {
                    name: 'version',
                    type: 'input',
                    message: 'Release version',
                    default: this.args.version,
                    when: !this.args.version,
                    validate: this.validateVersion
                }]);
                this.args.package = pack.package;
                this.args.version = pack.version;
            }
            if (this.validateVersion(this.args.version) !== true) {
                throw new Error(this.validateVersion(this.args.version) as string);
            }
            registry = new FileSystem(this.args.filename);
        } else {
            registry = this.getRegistry();
        }
        const packages = await this.getSystemPackages();
        const result = await publish({
            contextData: {
                logTemporaryFolder: getTempFolder(),
                systemPackages: packages,
                noInquirer: this.args.prompts
            },
            packageData: {
                registry,
                name: this.args.package,
                version: this.args.version,
                devclass: this.args.sapPackage,
                inc: this.args.increment as ReleaseType,
                preRelease: this.args.preRelease,
                preReleaseIdentifier: this.args.preReleaseIdentifier,
                tags: this.parseArrayArg('tag'),
                manifest: {
                    authors: this.args.authors,
                    backwardsCompatible: this.args.backwardsCompatible,
                    description: this.args.description,
                    git: this.args.git,
                    keywords: this.args.keywords,
                    license: this.args.license,
                    website: this.args.website,
                    dependencies: this.parseJsonArg('dependencies'),
                    sapEntries: this.parseJsonArg('sapEntries'),
                    postActivities: this.parseJsonArg('postActivities')
                },
            },
            publishData: {
                private: this.args.private,
                keepLatestReleaseManifestValues: !this.args.keepManifest,
                noLanguageTransport: this.args.langTr,
                noDependenciesDetection: this.args.autoDeps,
                skipCustomizingTransports: this.args.custTr,
                customizingTransports: this.args.cust,
                readme: this.parseTextArg('readme')
            },
            systemData: {
                releaseTimeout: this.parseNumberArg('timeout'),
                transportTarget: this.args.target
            }
        });
        Logger.success(`+ ${result.trmPackage.manifest.get().name} v${result.trmPackage.manifest.get().version}`);
    }

}