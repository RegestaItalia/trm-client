import { Inquirer, Logger } from "trm-commons";
import { AbstractRegistry, FileSystem, publish } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { getTempFolder } from "../../utils";
import { valid } from "semver";
import { extname, join } from "path";
import sanitize from "sanitize-filename";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class Publish extends AbstractCommand {

    private static readonly releaseOptions = [
        option("-P, --sap-package <sap package>", { name: "sapPackage", label: "SAP package", description: "SAP package that owns the release objects.", control: "sap-package-picker" }),
        option("-T, --target <target>", { name: "target", label: "Transport target", description: "Target system for release transports.", control: "transport-target-picker" }),
        option("--no-lang-tr", { name: "langTr", label: "Language transport", description: "Skip language transport generation.", control: "checkbox", defaultValue: true, negated: true }),
        option("--no-cust-tr", { name: "custTr", label: "Customizing transport", description: "Skip customizing transport generation.", control: "checkbox", defaultValue: true, negated: true }),
        option("--cust <customizing>", { name: "cust", label: "Customizing transports", description: "Customizing transport requests, separated by commas.", multiple: true }),
        option("--no-auto-deps", { name: "autoDeps", label: "Automatic dependencies", description: "Skip automatic dependency detection.", control: "checkbox", defaultValue: true, negated: true }),
        option("--authors <authors>", { name: "authors", label: "Authors", description: "Release authors, separated by commas.", multiple: true }),
        option("--backwards-compatible", { name: "backwardsCompatible", label: "Backwards compatible", description: "Mark the release as backwards compatible.", control: "checkbox" }),
        option("--description <description>", { name: "description", label: "Description", description: "Release description." }),
        option("--git <git url>", { name: "git", label: "Git URL", description: "Release Git repository URL." }),
        option("--keywords <keywords>", { name: "keywords", label: "Keywords", description: "Release keywords, separated by commas.", multiple: true }),
        option("--license <license>", { name: "license", label: "License", description: "Release license." }),
        option("--website <website url>", { name: "website", label: "Website", description: "Release website URL." }),
        option("--dependencies <dependencies>", { name: "dependencies", label: "Dependencies", description: "Release dependencies as JSON, or a path to a JSON file.", control: "textarea" }),
        option("--sap-entries <sap entries>", { name: "sapEntries", label: "SAP entries", description: "Release SAP entries as JSON, or a path to a JSON file.", control: "textarea" }),
        option("--post-activities <post activities>", { name: "postActivities", label: "Post activities", description: "Release post activities as JSON, or a path to a JSON file.", control: "textarea" }),
        option("--no-prompts", { name: "prompts", label: "Prompts", description: "Disable prompts and use automatic decisions.", control: "checkbox", defaultValue: true, guiRelevant: false, negated: true })
    ];

    public static readonly metadata: CommandMetadata[] = [
        {
            id: "publish",
            command: "publish",
            title: "Publish package",
            group: "package",
            groupPriority: 9,
            description: "Publish a package release to the registry.",
            icon: "Rocket",
            arguments: [
                argument(0, { name: "package", label: "Package", description: "Package name." }),
                argument(1, { name: "version", label: "Version", description: "Release version to publish.", required: false })
            ],
            options: [
                option("-i, --increment <increment>", { name: "increment", label: "Version increment", description: "Semantic version increment to use when no version is provided.", control: "select", defaultValue: "patch" }),
                option("--pre-release", { name: "preRelease", label: "Pre-release", description: "Publish the release as a pre-release.", control: "checkbox", defaultValue: false }),
                option("--pre-release-identifier <identifier>", { name: "preReleaseIdentifier", label: "Pre-release identifier", description: "Identifier to append to a pre-release version." }),
                option("--tag <tag>", { name: "tag", label: "Tags", description: "Release distribution tags, separated by commas.", multiple: true }),
                option("--private", { name: "private", label: "Private", description: "Mark the package as private. Registry visibility may not be changeable after the first publish.", control: "checkbox" }),
                option("--readme <readme>", { name: "readme", label: "Readme", description: "Release readme as Markdown, or a path to a Markdown file.", control: "textarea" }),
                option("--no-keep-manifest", { name: "keepManifest", label: "Reuse manifest", description: "Do not reuse values from the previous release manifest.", control: "checkbox", defaultValue: true, negated: true }),
                ...Publish.releaseOptions
            ],
            requirements: {
                requiresConnection: true,
                requiresTrmDependencies: true,
                requiresRegistry: true
            }
        },
        {
            id: "pack",
            command: "pack",
            aliases: ["export"],
            title: "Export package",
            group: "package",
            groupPriority: 7,
            description: "Export a package release to a local file.",
            icon: "FolderDown",
            arguments: [
                argument(0, { name: "package", label: "Package", description: "Package name." }),
                argument(1, { name: "version", label: "Version", description: "Release version." }),
                argument(2, { name: "filename", label: "Output file", description: "Output file name or path.", required: false, control: "file-picker", pickerType: "output" })
            ],
            options: Publish.releaseOptions,
            requirements: {
                requiresConnection: true,
                requiresTrmDependencies: true
            }
        }
    ];
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
            if (!this.args.filename) {
                this.args.filename = join(process.cwd(), `${sanitize(this.args.package)}.trm`);
            }
            const extension = extname(this.args.filename);
            if (extension !== '.trm') {
                this.args.filename = this.args.filename + '.trm';
            }
            this.validateOutputFileArg(this.args.filename);
            registry = new FileSystem(this.args.filename);
        } else {
            registry = this.getRegistry();
        }
        const packages = await this.getSystemPackages();
        const result = await publish({
            contextData: {
                logTemporaryFolder: getTempFolder(),
                systemPackages: packages,
                noInquirer: !this.args.prompts
            },
            packageData: {
                registry,
                name: this.args.package,
                version: this.args.version,
                devclass: this.args.sapPackage,
                inc: this.args.increment as any,
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
                keepLatestReleaseManifestValues: this.args.keepManifest,
                noLanguageTransport: !this.args.langTr,
                noDependenciesDetection: !this.args.autoDeps,
                skipCustomizingTransports: !this.args.custTr,
                customizingTransports: this.args.cust,
                readme: this.parseTextArg('readme')
            },
            systemData: {
                transportTarget: this.args.target
            }
        });
        Logger.success(`+ ${result.trmPackage.manifest.get().name} v${result.trmPackage.manifest.get().version}`);
    }

}
