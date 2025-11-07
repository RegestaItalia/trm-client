import { Command } from "commander";
import { RegisterCommandOpts } from "./RegisterCommandOpts";
import { checkCliUpdate, GlobalContext, getLogFolder, logError, CliVersionStatus } from "../utils";
import { LoggerType } from "./LoggerType";
import { InquirerType } from "./InquirerType";
import * as Core from "trm-core";
import * as Commons from "trm-commons";
import { RegistryAlias } from "../registryAlias";
import { SystemAlias } from "../systemAlias";
import chalk from "chalk";
import { connect, pickRegistry } from "./prompts";
import { readFileSync } from "fs";
import { Package } from "trm-registry-types";

export abstract class AbstractCommand {

    protected command: Command;
    protected registerOpts: RegisterCommandOpts = {};
    protected args: any = {};

    private cliVersionStatus: CliVersionStatus;
    private registry: Core.AbstractRegistry;
    private registryAuthData: boolean = false;
    private registryAuthFailed: Error;
    private systemPackages: Core.TrmPackage[];
    private trmDependenciesCheck: Core.CheckTrmDependencies;

    constructor(program: Command, protected readonly name: string, protected readonly aliases?: string[]) {
        this.command = program.command(this.name);
        if (aliases) {
            this.command.aliases(aliases);
        }
        this.init();
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
            Commons.Logger.loading(`Reading "${Core.SystemConnector.getDest()}" packages...`);
            this.systemPackages = await Core.SystemConnector.getInstalledPackages(true, true, true);
        }
        return this.systemPackages;
    }

    public async getTrmDependenciesCheck(): Promise<Core.CheckTrmDependencies> {
        if (!this.trmDependenciesCheck) {
            const packages = await this.getSystemPackages();
            this.trmDependenciesCheck = await Core.checkCoreTrmDependencies(packages);
        }
        return this.trmDependenciesCheck;
    }

    protected abstract init(): void;
    protected abstract handler(): Promise<void>;

    public register() {
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
        if(this.registerOpts.requiresR3trans){
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

    private parseCommandArgs(args1: any, args2: any): any {
        var args = this.command['_optionValues'] || {};
        if (!args1) {
            args1 = {};
        }
        if (!args2) {
            args2 = {};
        }
        if (typeof (args1) === 'string') {
            const oArg1 = this.command["_args"][0];
            args[oArg1.name()] = args1;
            if (typeof (args2) === 'string') {
                const oArg2 = this.command["_args"][1];
                args[oArg2.name()] = args2;
            } else {
                args = { ...args, ...args2 };
            }
        } else {
            args = { ...args, ...args1 };
        }

        // transform arguments with spaces into camel case
        args = Object.entries(args).reduce((acc, [key, value]) => {
            const newKey = key.includes(" ") ? key.replace(/ (\w)/g, (_, char) => char.toUpperCase()) : key;
            acc[newKey] = value;
            return acc;
        }, {} as any);

        return args;
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
        const trmDependencies = Core.getCoreTrmDependencies();
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
            } catch {
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

    private async execute(args1: any, args2: any): Promise<void> {
        this.args = this.parseCommandArgs(args1, args2);
        this.onArgs(); // optionally used in implementations to trigger some changes based on args
        var exitCode: number;
        try {
            if(this.registerOpts.requiresR3trans && process.platform === 'darwin'){
                // needs docker running
                
            }
            await GlobalContext.getInstance().load();
            await Commons.Plugin.call<{ core: typeof Core }>("client", "loadCore", { core: Core });
            await Commons.Plugin.call<{ commons: typeof Commons }>("client", "loadCommons", { commons: Commons });
            Commons.Inquirer.inquirer = this.getInquirer(InquirerType.CLI);
            Commons.Logger.logger = this.getLogger(this.args.logger, this.args.debug, this.args.loggerOutDir);

            if (process.platform !== 'win32' && process.platform !== 'darwin') {
                Commons.Logger.warning(`Running on untested OS "${process.platform}"! Some features aren't tested yet.`);
            }

            await this.getCliVersionStatus(); // prints possible updates

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
                registry = registryAlias.getRegistry();
                try {
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
                this.registryAuthData = !!registryAlias.authData;
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
                await system.connect();
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

            //Disappear like man was never here!
            exitCode = 0;
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