import { Logger } from "trm-commons";
import { AbstractRegistry, FileSystem, install, TrmPackage } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { getTempFolder, GlobalContext } from "../../utils";
import os from "node:os";
import { spawn } from "node:child_process";
import { Lockfile } from "trm-core/dist/lockfile";
import { extname } from "node:path";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

type PM = "npm" | "pnpm" | "yarn1";

export class Install extends AbstractCommand {

    private static readonly installOptions = [
        option("-T, --transport-layer <transport layer>", { name: "transportLayer", label: "Transport layer", description: "Transport layer for imported package objects. Defaults to the system transport layer.", control: "transport-layer-picker" }),
        option("--no-deps", { name: "deps", label: "Dependencies", description: "Skip dependency installation.", control: "checkbox", defaultValue: true, negated: true }),
        option("--no-obj-type", { name: "objType", label: "Object type checks", description: "Skip object type checks before import.", control: "checkbox", defaultValue: true, negated: true }),
        option("--no-obj-check", { name: "objCheck", label: "Object existence checks", description: "Skip object existence checks before import.", control: "checkbox", defaultValue: true, negated: true }),
        option("--no-sap-entries", { name: "sapEntries", label: "SAP entries", description: "Skip SAP entry checks before import.", control: "checkbox", defaultValue: true, negated: true }),
        option("--no-lang-tr", { name: "langTr", label: "Language transport", description: "Skip language transport import.", control: "checkbox", defaultValue: true, negated: true }),
        option("--no-cust-tr", { name: "custTr", label: "Customizing transports", description: "Skip customizing transport import.", control: "checkbox", defaultValue: true, negated: true }),
        option("--no-install-tr", { name: "installTr", label: "Install transport", description: "Do not create an install transport.", control: "checkbox", defaultValue: true, negated: true }),
        option("--namespace", { name: "namespace", label: "Customer namespace", description: "Import the customer namespace.", control: "checkbox" }),
        option("--package-replacements <replacements>", { name: "packageReplacements", label: "Package replacements", description: "SAP package replacements as JSON, or a path to a JSON file.", control: "textarea" }),
        option("--install-tr-target <target>", { name: "installTrTarget", label: "Install transport target", description: "Target system for the install transport.", control: "transport-target-picker" }),
        option("--no-prompts", { name: "prompts", label: "Prompts", description: "Disable prompts and use automatic decisions.", control: "checkbox", defaultValue: true, guiRelevant: false, negated: true })
    ];

    public static readonly metadata: CommandMetadata[] = [
        {
            id: "install",
            command: "install",
            aliases: ["i"],
            title: "Install package",
            group: "package",
            groupPriority: 10,
            description: "Install a package from the registry into the connected system.",
            icon: "PackagePlus",
            arguments: [
                argument(0, { name: "package", label: "Package", description: "Package name." }),
                argument(1, { name: "version", label: "Version", description: "Release version or distribution tag.", required: false, defaultValue: "latest" })
            ],
            options: Install.installOptions,
            requirements: {
                requiresConnection: true,
                requiresTrmDependencies: true,
                requiresR3trans: true,
                requiresRegistry: true
            }
        },
        {
            id: "clean-install",
            command: "clean-install",
            aliases: ["ci"],
            title: "Clean install",
            group: "package",
            groupPriority: 5,
            description: "Install a package from the registry using a lockfile.",
            icon: "PackageCheck",
            arguments: [
                argument(0, { name: "package", label: "Package", description: "Package name." }),
                argument(1, { name: "version", label: "Version", description: "Release version or distribution tag.", required: false, defaultValue: "latest" })
            ],
            options: [
                option("-L, --lock-file", { name: "lockFile", label: "Lockfile", description: "Lockfile to use for installation.", control: "file-picker", pickerType: "input", defaultValue: "trm-lock.json" }),
                ...Install.installOptions
            ],
            requirements: {
                requiresConnection: true,
                requiresTrmDependencies: true,
                requiresR3trans: true,
                requiresRegistry: true
            }
        },
        {
            id: "update",
            command: "update",
            title: "Update package or client",
            group: "package",
            guiRelevant: false,
            description: "Update the client, or update a package from the registry.",
            longDescription: "When no package name is provided, this command updates trm-client itself and ignores package options.",
            icon: "RefreshCw",
            arguments: [
                argument(0, { name: "package", label: "Package", description: "Package name.", required: false }),
                argument(1, { name: "version", label: "Version", description: "Release version or distribution tag.", required: false, defaultValue: "latest" })
            ],
            options: Install.installOptions,
            requirements: {
                requiresConnection: true,
                requiresTrmDependencies: true,
                requiresR3trans: true,
                requiresRegistry: true
            }
        },
        {
            id: "import",
            command: "import",
            title: "Import package file",
            group: "package",
            groupPriority: 8,
            description: "Import a package file into the connected system.",
            icon: "FolderUp",
            arguments: [
                argument(0, { name: "filename", label: "Package file", description: "Package file name or path.", control: "file-picker", pickerType: "input" })
            ],
            options: Install.installOptions,
            requirements: {
                requiresConnection: true,
                requiresTrmDependencies: true,
                requiresR3trans: true
            }
        }
    ];
    private async selfUpdate(): Promise<void> {
        const pm = this.detectPackageManager();
        const target = `trm-client@latest`;

        const command: { bin: string; args: string[] } =
            pm === "pnpm"
                ? { bin: "pnpm", args: ["add", "-g", target] }
                : pm === "yarn1"
                    ? { bin: "yarn", args: ["global", "add", target] }
                    : { bin: "npm", args: ["install", "-g", target] }; // default

        try {
            await this.spawnCommand(command.bin, command.args);
            Logger.success(`Client updated successfully.`);
        } catch (err: any) {
            if (this.isPermsError(err)) {
                Logger.error(this.formatPermsHelp(command.bin));
            }
            if (command.bin === "yarn" && this.looksLikeYarnBerry()) {
                Logger.error(`\Detected Yarn ≥2 (Berry). It doesn't support reliable global installs.\n` +
                    `    Try: npm install -g ${target}`
                );
            }
            throw err;
        }
    }

    private spawnCommand(bin: string, args: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn(bin, args, { stdio: "inherit" });
            child.on("error", reject);
            child.on("close", exitCode => {
                if (exitCode === 0) {
                    resolve();
                    return;
                }
                const error = new Error(`Command failed with exit code ${exitCode}: ${[bin, ...args].join(" ")}`);
                (error as any).exitCode = exitCode;
                reject(error);
            });
        });
    }

    private detectPackageManager(): PM {
        const ua = process.env.npm_config_user_agent ?? "";
        if (ua.includes("pnpm/")) return "pnpm";
        if (ua.includes("yarn/1.")) return "yarn1";
        return "npm";
    }

    private looksLikeYarnBerry(): boolean {
        const ua = process.env.npm_config_user_agent ?? "";
        return ua.includes("yarn/") && !ua.includes("yarn/1.");
    }

    private isPermsError(err: any): boolean {
        const msg = String(err?.message || err);
        return (
            err?.code === "EACCES" ||
            err?.errno === -13 ||
            /EACCES|EPERM|permission denied/i.test(msg)
        );
    }

    private formatPermsHelp(bin: string): string {
        const isUnix = os.platform() !== "win32";
        return (
            `Permission error installing globally.\n` +
            `Troubleshooting tips:\n` +
            (isUnix
                ? `  • If you used a system Node, configure a user-level global prefix:\n` +
                `      mkdir -p ~/.npm-global && npm config set prefix ~/.npm-global\n` +
                `      export PATH="$HOME/.npm-global/bin:$PATH"\n` +
                `    (Then rerun: ${bin} …)\n` +
                `  • Prefer using a Node version manager (nvm/fnm/volta) to avoid sudo.\n` +
                `  • Avoid running global installs with sudo unless you know why.\n`
                : `  • Run your shell as Administrator, or use a Node manager (nvs/volta).\n`) +
            ``
        );
    }

    protected onArgs(): void {
        if (this.name === 'update' && !this.args.package) {
            this.registerOpts = {
                noClientVersionCheck: true
            };
        }
    }

    protected onTrmDepVersionNotSatisfied(trmPackage: TrmPackage): boolean {
        return !trmPackage.compareName(this.args.package); // don't throw error if it's an install/update of a dependency not satisfied
    }

    protected async handler(): Promise<void> {
        if (this.name === 'update' && !this.args.package) {
            await this.selfUpdate();
            return;
        }
        var registry: AbstractRegistry;
        if (this.name === 'import') {
            const extension = extname(this.args.filename);
            if (extension !== '.trm') {
                this.args.filename = this.args.filename + 'trm';
            }
            this.validateInputFileArg(this.args.filename);
            registry = new FileSystem(this.args.filename);
        } else {
            registry = this.getRegistry();
        }
        const packages = await this.getSystemPackages();
        const result = await install({
            contextData: {
                r3transOptions: {
                    tempDirPath: getTempFolder(),
                    r3transDirPath: this.args.r3transPath,
                    useDocker: GlobalContext.getInstance().getSettings().r3transDocker,
                    dockerOptions: {
                        name: GlobalContext.getInstance().getSettings().r3transDockerName
                    }
                },
                noInquirer: !this.args.prompts,
                systemPackages: packages,
                noR3transInfo: false
            },
            packageData: {
                registry,
                name: this.args.package,
                version: this.args.version,
                overwrite: this.name === 'update'
            },
            installData: {
                checks: {
                    noDependencies: !this.args.deps,
                    noObjectTypes: !this.args.objType,
                    noSapEntries: !this.args.sapEntries,
                    noExistingObjects: !this.args.objCheck,
                    lockfile: this.args.lockFile ? Lockfile.fromJson(this.parseJsonArg('lockFile')) : undefined
                },
                import: {
                    noLang: !this.args.langTr,
                    noCust: !this.args.custTr,
                    replaceExistingTransports: false
                },
                installDevclass: {
                    keepOriginal: false,
                    transportLayer: this.args.transportLayer,
                    replacements: this.parseJsonArg('packageReplacements'),
                    skipNamespace: !this.args.namespace
                },
                installTransport: {
                    create: this.args.installTr,
                    targetSystem: this.args.installTrTarget
                }
            }
        });
        var sOutput = `${result.manifest.name} v${result.manifest.version} installed`;
        Logger.success(sOutput);
    }

}
