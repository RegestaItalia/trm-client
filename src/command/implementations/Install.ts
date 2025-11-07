import { Logger } from "trm-commons";
import { AbstractRegistry, FileSystem, install, TrmPackage } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { getTempFolder, GlobalContext } from "../../utils";
import { execa } from "execa";
import os from "node:os";
import { Lockfile } from "trm-core/dist/lockfile";

type PM = "npm" | "pnpm" | "yarn1";

export class Install extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.requiresTrmDependencies = true;
        this.registerOpts.requiresR3trans = true;
        if (this.name === 'update') {
            this.registerOpts.requiresRegistry = true;
            this.command.argument(`[package]`, `Name of the package.`);
            this.command.argument(`[version]`, `Version (or tag) of the release.`, `latest`);
            this.command.description(`Update trm-client / Update package from registry into system.`);
            this.command.addHelpText(`before`, `When no package name is specified, trm-client will self-update; all options are invalid, in this case.`);
        } else if (this.name === 'install') {
            this.registerOpts.requiresRegistry = true;
            this.command.argument(`<package>`, `Name of the package.`);
            this.command.argument(`[version]`, `Version (or tag) of the release.`, `latest`);
            this.command.description(`Install package from registry into system.`);
        } else if (this.name === 'clean-install') {
            this.registerOpts.requiresRegistry = true;
            this.command.argument(`<package>`, `Name of the package.`);
            this.command.argument(`[version]`, `Version (or tag) of the release.`, `latest`);
            this.command.description(`Clean install package from registry into system (requires lockfile).`);
            this.command.option(`-L, --lock-file`, `Install lockfile`, `trm-lock.json`);
        } else if (this.name === 'import') {
            this.command.argument(`<filename>`, `Name (or path) of the file.`);
            this.command.description(`Import a package (as a file) into system.`);
        }
        this.command.option(`-t, --timeout <seconds>`, `Transport import timeout (in seconds)`, `180`);
        this.command.option(`-T, --transport-layer <transport layer>`, `Package transport layer. (default: System default)`);
        this.command.option(`--no-deps`, `Do not install dependencies.`, false);
        this.command.option(`--no-obj-type`, `Do not check object types before import.`, false);
        this.command.option(`--no-obj-check`, `Do not check if objects before import.`, false);
        this.command.option(`--no-sap-entries`, `Do not check SAP entries before import.`, false);
        this.command.option(`--no-lang-tr`, `Do not import language (translation) transport.`, false);
        this.command.option(`--no-cust-tr`, `Do not import customizing transports.`, false);
        this.command.option(`--no-install-tr`, `Do not create install transport.`, false);
        this.command.option(`--no-namespace`, `Do not import namespace.`, false);
        this.command.option(`--package-replacements <replacements>`, `SAP Package replacements (JSON or path to JSON file)`);
        this.command.option(`--install-tr-target <target>`, `Install transport target system`);
        this.command.option(`--no-prompts`, `No prompts (will force some decisions).`, false);
    }

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
            await execa(command.bin, command.args, { stdio: "inherit" });
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
            this.registerOpts = {};
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
                noInquirer: this.args.noPrompts,
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
                    noDependencies: this.args.noDeps,
                    noObjectTypes: this.args.noObjType,
                    noSapEntries: this.args.noSapEntries,
                    noExistingObjects: this.args.noObjCheck,
                    lockfile: this.args.lockFile ? Lockfile.fromJson(this.parseJsonArg('lockFile')) : undefined
                },
                import: {
                    noLang: this.args.noLangTr,
                    noCust: this.args.noCustTr,
                    timeout: this.parseNumberArg('timeout'),
                    replaceExistingTransports: false
                },
                installDevclass: {
                    keepOriginal: false,
                    transportLayer: this.args.transportLayer,
                    replacements: this.parseJsonArg('packageReplacements'),
                    skipNamespace: this.args.noNamespace
                },
                installTransport: {
                    create: !!this.args.noInstallTransport,
                    targetSystem: this.args.installTrTarget
                }
            }
        });
        var sOutput = `${result.manifest.name} v${result.manifest.version} installed`;
        if (result.installTransport) {
            sOutput += `, use ${result.installTransport.trkorr} transport in landscape`;
        }
        Logger.success(sOutput);
    }

}