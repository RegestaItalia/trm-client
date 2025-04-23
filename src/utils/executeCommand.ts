import * as commands from "../commands";
import { SystemAlias } from "../systemAlias";
import { logError } from "./logError";
import { checkTrmDependencies } from "./checkTrmDependencies";
import { checkCliUpdate } from "./checkCliUpdate";
import { Inquirer, CliInquirer, CliLogFileLogger, CliLogger, ConsoleLogger, DummyLogger, Logger, ISystemConnector, SystemConnector, RegistryProvider, AbstractRegistry } from "trm-core";
import { getLogFolder } from "./getLogFolder";
import { RegistryAlias } from "../registryAlias";
import { CommandContext } from "../commands/commons";

export enum LoggerType {
    CLI = 'CLI',
    CLI_LOG = 'CLI_LOG',
    CONSOLE = 'CONSOLE',
    VOID = 'VOID',
    KEY = 'VALUE'
}

export enum InquirerType {
    CLI = 'CLI'
}

const _getLogger = (type: LoggerType, debug: boolean, logOutputFolder?: string): any => {
    if (!logOutputFolder || logOutputFolder.trim().toLowerCase() === 'default') {
        logOutputFolder = getLogFolder();
    }
    switch (type) {
        case LoggerType.CLI: return new CliLogger(debug);
        case LoggerType.CLI_LOG: return new CliLogFileLogger(logOutputFolder, debug);
        case LoggerType.CONSOLE: return new ConsoleLogger(debug);
        case LoggerType.VOID: return new DummyLogger();
        default: throw new Error(`Unknown logger type "${type}". Possible values are ${Object.keys(LoggerType).map(k => LoggerType[k]).join(', ')}.`);
    }
}

const _getInquirer = (type: InquirerType) => {
    switch (type) {
        case InquirerType.CLI: return new CliInquirer();
        default: throw new Error(`Unknown inquirer type "${type}". Possible values are ${Object.keys(InquirerType).map(k => InquirerType[k]).join(', ')}.`);
    }
}

export async function executeCommand(args: any) {
    var exitCode: number;
    try {
        Inquirer.inquirer = _getInquirer(InquirerType.CLI);
        Logger.logger = _getLogger(args.logType, args.debug, args.logOutputFolder);

        if (!/^win/i.test(process.platform)) {
            Logger.warning(`Running on untested OS ${process.platform}! Some features aren't tested yet.`);
        }

        const requiresConnection = args.requiresConnection;
        const requiresTrmDependencies = args.requiresTrmDependencies;
        const requiresRegistry = args.requiresRegistry;
        const registryAuthBlacklist = args.registryAuthBlacklist;
        const ignoreRegistryUnreachable = args.ignoreRegistryUnreachable;

        await checkCliUpdate(true);

        if (requiresConnection) {
            var system: ISystemConnector;
            if (args.systemAlias) {
                system = SystemAlias.get(args.systemAlias).getConnection();
            } else {
                const skipCreateAlias = ['createAlias', 'deleteAlias', 'alias'];
                system = (await commands.connect(args as commands.ConnectArguments, !skipCreateAlias.includes(args.command), args.addNoConnection)).connection;
            }
            await system.connect();
            SystemConnector.systemConnector = system;
            if (requiresTrmDependencies) {
                await checkTrmDependencies(args);
            }
        }

        if (requiresRegistry) {
            var registryAlias: RegistryAlias;
            var registry: AbstractRegistry;
            if (args.registry) {
                registryAlias = RegistryAlias.get(args.registry);
            } else if (args.registryEndpoint) {
                registryAlias = RegistryAlias.getTemporaryInstance(args.registryEndpoint, args.registryAuth);
            } else {
                registryAlias = await commands.pickRegistry();
            }
            registry = registryAlias.getRegistry();
            try {
                const registryPing = await registry.ping();
                if (registryPing.wallMessage) {
                    if (registryAuthBlacklist.includes(registryPing.authenticationType)) {
                        throw new Error(`This command is not supported by registry "${registry.name}".`);
                    }
                    Logger.registryResponse(registryPing.wallMessage);
                }
            } catch (e) {
                Logger.error(e, true);
                if (!ignoreRegistryUnreachable) {
                    throw new Error(`Registry "${registry.name}" is unreachable.`);
                }
            }
            if (registryAlias.authData) {
                try {
                    await registry.authenticate(registryAlias.authData);
                } catch (e) {
                    Logger.error(e, true);
                    Logger.warning(`Registry "${registry.name}" login failed.`);
                }
            }
            CommandContext.registry = registry;
            RegistryProvider.registry.push(registry);
            RegistryAlias.getAll().forEach(o => {
                var append = true;
                var aliasRegistry = RegistryAlias.get(o.alias).getRegistry();
                RegistryProvider.registry.forEach(k => {
                    if(append){
                        append = !k.compare(aliasRegistry);
                    }
                });
                if(append){
                    RegistryProvider.registry.push(aliasRegistry);
                }
            });
        }
        var commandFn = args.command;
        if (!commands[commandFn]) {
            commandFn = `_${commandFn}`;
            if (!commands[commandFn]) {
                throw new Error(`Command "${args.command}" doesn't exist.`);
            }
        }
        await commands[commandFn](args);
        //force loading clear in case it was left hanging
        if (Logger.logger instanceof CliLogger || Logger.logger instanceof CliLogFileLogger) {
            Logger.logger.forceStop();
        }

        //Disappear like man was never here!
        exitCode = 0;
    } catch (e) {
        await logError(e);
        exitCode = 1;
    } finally {
        if (Logger.logger instanceof CliLogFileLogger) {
            const sessionId = Logger.logger.getSessionId();
            const logFilePath = Logger.logger.getFilePath();
            console.log(`Log output "${logFilePath}" for session ID ${sessionId}.`);
        }
        process.exit(exitCode);
    }
}