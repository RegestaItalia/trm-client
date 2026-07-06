import { Command } from "commander";
import { RegisterCommandOpts } from "./RegisterCommandOpts";
import { checkCliUpdate, GlobalContext, getLogFolder, logError, CliVersionStatus, DummyConnector, isDockerRunning } from "../utils";
import { LoggerType } from "./LoggerType";
import { InquirerType } from "./InquirerType";
import * as Core from "trm-core";
import * as Commons from "trm-commons";
import { RegistryAlias } from "../registryAlias";
import { SystemAlias } from "../systemAlias";
import chalk from "chalk";
import { connect, pickRegistry } from "./prompts";
import { accessSync, existsSync, readFileSync, statSync } from "fs";
import { Package } from "trm-registry-types";
import { basename, dirname, resolve } from "path";
import constants from "constants";
import sanitize from "sanitize-filename";
import { CommandMetadata, CommandMetadataExport } from "./metadata/CommandMetadata";
import { applyCommandMetadata } from "./metadata/applyCommandMetadata";

export interface AbstractCommandRunOptions {
    registry?: Core.AbstractRegistry;
}

export abstract class AbstractCommand {

    protected command: Command;
    protected registerOpts: RegisterCommandOpts = {};
    protected args: any = {};
    protected readonly name: string;
    protected readonly aliases?: string[];
    protected readonly subcommand?: string;

    private cliVersionStatus: CliVersionStatus;
    private registry: Core.AbstractRegistry;
    private registryAuthData: boolean = false;
    private registryAuthFailed: Error;
    private systemPackages: Core.TrmPackage[];
    private trmDependenciesCheck: Core.CheckTrmDependencies;
    private metadata: CommandMetadata;

    constructor(program: Command, name: string, aliases?: string[], subcommand?: string);
    constructor(name: string, aliases?: string[], subcommand?: string);
    constructor(
        programOrName: Command | string,
        nameOrAliases?: string | string[],
        aliasesOrSubcommand?: string[] | string,
        subcommandArg?: string
    ) {
        const program = typeof programOrName === "string" ? undefined : programOrName;
        this.name = typeof programOrName === "string" ? programOrName : nameOrAliases as string;
        this.aliases = typeof programOrName === "string" ? nameOrAliases as string[] : aliasesOrSubcommand as string[];
        this.subcommand = typeof programOrName === "string" ? aliasesOrSubcommand as string : subcommandArg;

        this.metadata = this.getMetadata();
        if (this.metadata) {
            this.registerOpts = { ...this.metadata.requirements };
        }

        if (program) {
            const index = program.commands.findIndex(c => c.name() === this.name);
            if (index >= 0) {
                if (this.subcommand) {
                    this.command = program.commands[index];
                } else {
                    throw new Error(`Command "${this.name}" declared multiple times without subcommand.`);
                }
            } else {
                this.command = program.command(this.name);
            }
            if (this.subcommand) {
                this.command = this.command.command(this.subcommand);
            }
            if (this.aliases) {
                this.command.aliases(this.aliases);
            }
            if (this.metadata) {
                applyCommandMetadata(this.command, this.metadata);
            }
        }
    }

    private getMetadata(): CommandMetadata | undefined {
        const metadata = (this.constructor as typeof AbstractCommand & { metadata?: CommandMetadataExport }).metadata;
        const entries = Array.isArray(metadata) ? metadata : metadata ? [metadata] : [];
        return entries.find(entry => entry.command === this.name && entry.subcommand === this.subcommand);
    }

    public async getCliVersionStatus(): Promise<CliVersionStatus> {
        if (!this.cliVersionStatus) {
            this.cliVersionStatus = await checkCliUpdate(true);
        }
        return this.cliVersionStatus;
    }

    public getRegistry(): Core.AbstractRegistry {
        return this.registry;
    }

    public hasRegistryAuthData(): boolean {
        return this.registryAuthData;
    }

    public getRegistryAuthError(): Error {
        return this.registryAuthFailed;
    }

    public async registryWhoAmI(): Promise<void> {
        const registry = this.getRegistry();
        if (registry) {
            Commons.Logger.loading(`Authenticating...`);
            const whoAmI = await registry.whoAmI();
            Commons.Logger.info(`Username: ${whoAmI.user}`);
            if (whoAmI.messages) {
                whoAmI.messages.forEach(m => Commons.Logger.registryResponse(m));
            }
        }
    }

    public async viewRegistryPackage(packageName: string, print: boolean = true): Promise<Package> {
        Commons.Logger.loading(`Reading registry...`);
        var oRegistryView: Package;
        try {
            oRegistryView = await this.getRegistry().getPackage(packageName, 'latest');
        } catch (e) {
            Commons.Logger.error(e, true);
            oRegistryView = null;
        }
        if (print) {
            if (!oRegistryView) {
                Commons.Logger.warning(`${chalk.bold('WARNING')}: This package was not found on the registry.`);
                Commons.Logger.warning(`${chalk.bold('WARNING')}: This package may have been deleted!`);
            } else {
                if (oRegistryView.deprecated) {
                    if (oRegistryView.deprecated_message) {
                        Commons.Logger.warning(`${chalk.bold('WARNING deprecate')}: ${oRegistryView.deprecated_message}`);
                    } else {
                        Commons.Logger.warning(`${chalk.bold('WARNING deprecate')}: v${oRegistryView.manifest.version} is deprecated`);
                    }
                }
            }
        }
        return oRegistryView;
    }

    public async getSystemPackages(): Promise<Core.TrmPackage[]> {
        if (!this.systemPackages) {
            if (Core.SystemConnector.systemConnector instanceof DummyConnector) {
                this.systemPackages = [];
            } else {
                Commons.Logger.loading(`Reading "${Core.SystemConnector.getDest()}" packages...`);
                this.systemPackages = await Core.SystemConnector.getInstalledPackages(true, true);
            }
        }
        return this.systemPackages;
    }

    public async getTrmDependenciesCheck(): Promise<Core.CheckTrmDependencies> {
        if (!this.trmDependenciesCheck) {
            const packages = await this.getSystemPackages();
            this.trmDependenciesCheck = await Core.checkCoreTrmDependencies(packages, GlobalContext.getInstance().getGlobalNodeModules());
        }
        return this.trmDependenciesCheck;
    }

    protected abstract handler(): Promise<void>;

    public register() {
        if (!this.command) {
            throw new Error(`Command "${this.name}" cannot be registered without a Commander program.`);
        }
        const defaultLogger = GlobalContext.getInstance().getSettings().loggerType;
        const logOutputFolder = GlobalContext.getInstance().getSettings().logOutputFolder;

        this.command
            .option(`--logger <logger type>`, `Logger type.`, defaultLogger)
            .option(`--logger-out-dir <logger out dir>`, `Logger output directory.`, logOutputFolder)
            .option(`--debug`, `Debug.`, false);

        if (this.registerOpts.requiresConnection) {
            this.command
                .option(`-d, --dest <destination>`, `RFC System ID (Destination).`)
                .option(`-u, --user <username>`, `Logon username.`)
                .option(`-p, --password <password>`, `Logon password.`)
                .option(`-m, --mandt <mandt>`, `Logon client.`)
                .option(`-l, --lang <language>`, `Logon language.`)
                .option(`-h, --application-server <address>`, `RFC Application server address.`)
                .option(`-r, --sap-router <sap router>`, `RFC SAP Router.`)
                .option(`-n, --sys-nr <sysnr>`, `Instance number.`)
                .option(`-e, --endpoint <endpoint>`, `REST endpoint.`)
                .option(`-x, --forward-rfc-dest [destination]`, `REST forward destination.`, `NONE`);
            if (!this.registerOpts.noSystemAlias) {
                this.command
                    .option(`-a, --alias <alias>`, `System Alias.`);
            }
        }
        if (this.registerOpts.requiresRegistry) {
            this.command
                .option(`-R, --registry <registry>`, `Registry.`);
            if (!this.registerOpts.onlyRegistryAlias) {
                this.command
                    .option(`-E, --registry-endpoint <endpoint>`, `Registry endpoint.`)
                    .option(`-A, --registry-auth <authentication>`, `Registry authentication (JSON or path to JSON file).`);
            }
        }
        if (this.registerOpts.requiresR3trans) {
            this.command
                .option(`--r3trans-path <path>`, `R3trans program path. (default: Environment variable R3TRANS_HOME)`);
        }

        this.command.action(this.execute.bind(this));
    }

    private getLogger(type: LoggerType, debug: boolean, logOutputFolder?: string): Commons.ILogger {
        if (!logOutputFolder || logOutputFolder.trim().toLowerCase() === 'default') {
            logOutputFolder = getLogFolder();
        }
        switch (type) {
            case LoggerType.CLI: return new Commons.CliLogger(debug);
            case LoggerType.CLI_LOG: return new Commons.CliLogFileLogger(logOutputFolder, debug);
            case LoggerType.CONSOLE: return new Commons.ConsoleLogger(debug);
            case LoggerType.VOID: return new Commons.DummyLogger();
            default: throw new Error(`Unknown logger type "${type}". Possible values are ${Object.keys(LoggerType).map(k => LoggerType[k]).join(', ')}.`);
        }
    }

    private getInquirer(type: InquirerType): Commons.IInquirer {
        switch (type) {
            case InquirerType.CLI: return new Commons.CliInquirer();
            default: throw new Error(`Unknown inquirer type "${type}". Possible values are ${Object.keys(InquirerType).map(k => InquirerType[k]).join(', ')}.`);
        }
    }

    private normalizeArgs(args: any = {}): any {
        const defaultLogger = GlobalContext.getInstance().getSettings().loggerType;
        const logOutputFolder = GlobalContext.getInstance().getSettings().logOutputFolder;
        const normalized = {
            logger: defaultLogger,
            loggerOutDir: logOutputFolder,
            debug: false
        };

        if (this.metadata) {
            [...this.metadata.arguments, ...this.metadata.options].forEach(field => {
                if (field.defaultValue !== undefined) {
                    normalized[field.name] = field.defaultValue;
                }
            });
        }

        const providedArgs = Object.entries(args).reduce((acc, [key, value]) => {
            const newKey = key.replace(/[ -](\w)/g, (_, char) => char.toUpperCase());
            acc[newKey] = value;
            return acc;
        }, {} as any);

        return { ...normalized, ...providedArgs };
    }

    private parseCommandArgs(argsValues: any[]): any {
        var args: any = {};
        const commandOpts = this.command ? this.command.opts() : {};
        const commandArgs = this.metadata ? [...this.metadata.arguments].sort((a, b) => a.position - b.position) : [];
        commandArgs.forEach((a, i) => {
            if (typeof (argsValues[i]) === 'string') {
                args[a.name] = argsValues[i];
            }
        });
        return this.normalizeArgs({ ...commandOpts, ...args });
    }

    public validateOutputFileArg(argValue: string): void {
        const resolvedPath = resolve(argValue);

        // If path exists
        if (existsSync(resolvedPath)) {
            const stats = statSync(resolvedPath);

            if (stats.isDirectory()) {
                // Existing directory: must be writable
                try {
                    accessSync(resolvedPath, constants.W_OK);
                } catch {
                    throw new Error(`No write access to directory "${resolvedPath}"`);
                }
                return;
            }

            if (stats.isFile()) {
                const dir = dirname(resolvedPath);

                // Existing file's directory must be writable
                try {
                    accessSync(dir, constants.W_OK);
                } catch {
                    throw new Error(`No write access to directory "${dir}"`);
                }

                const fileName = basename(resolvedPath);
                const sanitizedFileName = sanitize(fileName);

                if (fileName !== sanitizedFileName) {
                    throw new Error(`Invalid filename "${fileName}"`);
                }

                return;
            }

            throw new Error(`Output path "${resolvedPath}" is neither a file nor a directory`);
        }

        // Path does not exist: validate parent directory + filename
        const dir = dirname(resolvedPath);
        const fileName = basename(resolvedPath);
        const sanitizedFileName = sanitize(fileName);

        if (!existsSync(dir)) {
            throw new Error(`Parent directory does not exist "${dir}"`);
        }

        try {
            accessSync(dir, constants.W_OK);
        } catch {
            throw new Error(`No write access to directory "${dir}"`);
        }

        if (fileName !== sanitizedFileName) {
            throw new Error(`Invalid filename "${fileName}"`);
        }
    }

    public validateInputFileArg(argValue: string): void {
        const resolvedPath = resolve(argValue);

        if (!existsSync(resolvedPath)) {
            throw new Error(`"${resolvedPath}" does not exist`);
        }

        const stats = statSync(resolvedPath);
        if (!stats.isFile()) {
            throw new Error(`"${resolvedPath}" is not a file`);
        }
    }

    protected onArgs(): void {
        // no changes in default behaviour
    }

    protected onTrmDepMissing(dependency: string): boolean {
        // no changes in default behaviour
        return true;
    }

    protected onTrmDepVersionNotSatisfied(trmPackage: Core.TrmPackage): boolean {
        // no changes in default behaviour
        return true;
    }

    private async checkTrmDependencies() {
        const trmDependenciesCheck = await this.getTrmDependenciesCheck();
        const trmDependencies = Core.getCoreTrmDependencies(GlobalContext.getInstance().getGlobalNodeModules());
        trmDependenciesCheck.missingDependencies.forEach(missingDependency => {
            if (this.onTrmDepMissing(missingDependency)) {
                throw new Error(`Package "${missingDependency}" is not installed on ${Core.SystemConnector.getDest()}.`);
            }
        });
        trmDependenciesCheck.versionNotSatisfiedDependencies.forEach(dependency => {
            if (this.onTrmDepVersionNotSatisfied(dependency)) {
                const versionRange = trmDependencies[dependency.packageName];
                throw new Error(`Package "${dependency.packageName}" version ${dependency.manifest.get().version} is installed on ${Core.SystemConnector.getDest()}, but does not satisfy dependency version ${versionRange}. Update with command ${chalk.italic('trm update ' + dependency.packageName)}`);
            }
        });
    }

    public parseTextArg(name: string): string {
        if (this.args[name]) {
            try {
                return readFileSync(this.args[name]).toString();
            } catch {
                return this.args[name];
            }
        }
    }

    public parseJsonArg(name: string): any {
        if (this.args[name]) {
            var sValue: string;
            try {
                sValue = readFileSync(this.args[name]).toString();
            } catch (e) {
                sValue = this.args[name];
            }
            try {
                return JSON.parse(sValue);
            } catch { }
        }
    }

    public parseArrayArg(name: string): string[] {
        if (this.args[name]) {
            try {
                return this.args[name].split(',').map(s => s.trim());
            } catch { }
        }
    }

    public parseNumberArg(name: string): number {
        if (this.args[name]) {
            try {
                return Number(this.args[name]);
            } catch { }
        }
    }

    public async run(args: any = {}, options: AbstractCommandRunOptions = {}): Promise<void> {
        this.args = this.normalizeArgs(args);
        this.onArgs(); // optionally used in implementations to trigger some changes based on args
        this.registry = options.registry;
        try{
            await this.handler();
        }catch(e){
            await logError(e);
            throw new Error("Action failed.");
        }
    }

    private async execute(...args: any[]): Promise<void> {
        var exitCode = 0;
        this.args = this.parseCommandArgs(args);
        this.onArgs(); // optionally used in implementations to trigger some changes based on args
        try {
            await GlobalContext.getInstance().load();
            await Commons.Plugin.call<{ core: typeof Core }>("client", "loadCore", { core: Core });
            await Commons.Plugin.call<{ commons: typeof Commons }>("client", "loadCommons", { commons: Commons });
            Commons.Inquirer.inquirer = this.getInquirer(InquirerType.CLI);
            Commons.Logger.logger = this.getLogger(this.args.logger, this.args.debug, this.args.loggerOutDir);

            /*
            TODO: this is now useless as r3trans is now optional; needs a refactor?

            const useDocker = GlobalContext.getInstance().getSettings().r3transDocker;
            if (this.registerOpts.requiresR3trans && useDocker) {
                Commons.Logger.info(`This command needs R3trans program dockerized.`);
                Commons.Logger.loading(`Checking if docker is running...`);
                if (await isDockerRunning()) {
                    const dockerName = GlobalContext.getInstance().getSettings().r3transDockerName;
                    Commons.Logger.info(`Docker "${dockerName || 'local/r3trans'}" will be used.`);
                } else {
                    throw new Error(`Command needs R3trans dockerized, docker engine is not currently running.`);
                }
            }
            */
            if (process.platform !== 'win32' && process.platform !== 'darwin' && process.platform !== 'linux') {
                Commons.Logger.warning(`Running on untested OS "${process.platform}"! Some features aren't tested yet.`);
            }

            if (!this.registerOpts.noClientVersionCheck) {
                await this.getCliVersionStatus(); // prints possible updates
            }

            if (this.registerOpts.requiresRegistry) {
                var registryAlias: RegistryAlias;
                var registry: Core.AbstractRegistry;
                if (this.args.registry) {
                    registryAlias = RegistryAlias.get(this.args.registry);
                } else if (this.args.registryEndpoint) {
                    registryAlias = RegistryAlias.getTemporaryInstance(this.args.registryEndpoint, this.parseJsonArg('registryAuth'));
                } else {
                    registryAlias = await pickRegistry();
                }
                if (registryAlias) {
                    registry = registryAlias.getRegistry();
                }
                try {
                    Commons.Logger.loading(`Connecting to registry "${registry.name}" (${registry.endpoint})...`);
                    const registryPing = await registry.ping();
                    if (this.registerOpts.registryAuthBlacklist && this.registerOpts.registryAuthBlacklist.includes(registryPing.authentication_type)) {
                        throw new Error(`This command is not supported by registry "${registry.name}".`);
                    }
                    if (registryPing.messages) {
                        registryPing.messages.forEach(m => Commons.Logger.registryResponse(m));
                    }
                } catch (e) {
                    Commons.Logger.error(e, true);
                    if (!this.registerOpts.ignoreRegistryUnreachable) {
                        throw new Error(`Registry "${registry.name}" is unreachable.`);
                    }
                }
                if (registryAlias.authData) {
                    try {
                        await registry.authenticate(registryAlias.authData);
                    } catch (e) {
                        this.registryAuthFailed = e;
                        Commons.Logger.error(e, true);
                        Commons.Logger.warning(`Registry "${registry.name}" login failed.`);
                    }
                }
                this.registry = registry;
                this.registryAuthData = !!registryAlias?.authData;
                Core.RegistryProvider.registry.push(registry);
            }

            //adding all registries to provider even if not required in command
            RegistryAlias.getAll().forEach(o => {
                var append = true;
                var aliasRegistry = RegistryAlias.get(o.alias).getRegistry();
                Core.RegistryProvider.registry.forEach(k => {
                    if (append) {
                        append = !k.compare(aliasRegistry);
                    }
                });
                if (append) {
                    Core.RegistryProvider.registry.push(aliasRegistry);
                }
            });

            if (this.registerOpts.requiresConnection) {
                var system: Core.ISystemConnector;
                if (this.args.alias) {
                    system = SystemAlias.get(this.args.alias).getConnection();
                } else {
                    system = (
                        await connect(
                            this.args as any,
                            true,
                            this.registerOpts.addNoConnection
                        )
                    ).getSystemConnector() as Core.ISystemConnector;
                }
                await system.connect(false);
                Core.SystemConnector.systemConnector = system;
                await Commons.Plugin.call<Core.ISystemConnector>("client", "onInitializeSystemConnector", Core.SystemConnector.systemConnector);
                if (this.registerOpts.requiresTrmDependencies) {
                    await this.checkTrmDependencies();
                }
            }

            await this.handler();

            //force loading clear in case it was left hanging
            if (Commons.Logger.logger instanceof Commons.CliLogger || Commons.Logger.logger instanceof Commons.CliLogFileLogger) {
                Commons.Logger.logger.forceStop();
            }
        } catch (e) {
            await logError(e);
            exitCode = 1;
        } finally {
            if (Core.SystemConnector.systemConnector) {
                try {
                    await Core.SystemConnector.closeConnection();
                } catch (e) {
                    Commons.Logger.error(`Couldn't close system connection!`, true);
                    Commons.Logger.log(e.toString(), true);
                }
            }
            if (Commons.Logger.logger instanceof Commons.CliLogFileLogger) {
                const sessionId = Commons.Logger.logger.getSessionId();
                const logFilePath = Commons.Logger.logger.getFilePath();
                Commons.Logger.info(`Saved log output "${logFilePath}" for session ID ${sessionId}.`);
            }
            process.exit(exitCode);
        }
    }

}
