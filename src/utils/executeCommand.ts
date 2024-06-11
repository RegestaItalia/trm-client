import * as commands from "../commands";
import { SystemAlias } from "../systemAlias";
import { logError } from "./logError";
import { checkTrmDependencies } from "./checkTrmDependencies";
import { checkCliUpdate } from "./checkCliUpdate";
import { Inquirer, CliInquirer, CliLogFileLogger, CliLogger, ConsoleLogger, DummyLogger, Logger, ServerSystemConnector, Registry, SystemConnector } from "trm-core";
import { getLogFolder } from "./getLogFolder";
import { CommandRegistry } from "../commands/commons";
import { RegistryAlias } from "../registryAlias";

export enum LoggerType {
    CLI = 'CLI',
    CLI_LOG = 'CLI_LOG',
    CONSOLE = 'CONSOLE',
    VOID = 'VOID'
}

export enum InquirerType {
    CLI = 'CLI'
}

const _getLogger = (type: LoggerType, debug: boolean): any => {
    switch (type) {
        case LoggerType.CLI: return new CliLogger(debug);
        case LoggerType.CLI_LOG: return new CliLogFileLogger(getLogFolder(), debug);
        case LoggerType.CONSOLE: return new ConsoleLogger(debug);
        case LoggerType.VOID: return new DummyLogger();
        default: throw new Error(`Unknown logger type "${type}".`);
    }
}

const _getInquirer = (type: InquirerType) => {
    switch (type) {
        case InquirerType.CLI: return new CliInquirer();
        default: throw new Error(`Unknown inquirer type "${type}".`);
    }
}

export async function executeCommand(args: any) {
    try {
        Inquirer.inquirer = _getInquirer(InquirerType.CLI);
        Logger.logger = _getLogger(args.logType, args.verbose);

        const requiresConnection = args.requiresConnection;
        const requiresTrmDependencies = args.requiresTrmDependencies;
        const requiresRegistry = args.requiresRegistry;
        const registryAuthBlacklist = args.registryAuthBlacklist;
        const ignoreRegistryUnreachable = args.ignoreRegistryUnreachable;

        await checkCliUpdate();

        var system: ServerSystemConnector;
        var registry: Registry;
        if (requiresConnection) {
            if (args.systemAlias) {
                system = SystemAlias.get(args.systemAlias).getConnection();
            } else {
                const connectionArgs = await commands.connect(args as commands.ConnectArguments, {});
                system = new ServerSystemConnector({
                    ashost: connectionArgs.ashost,
                    dest: connectionArgs.dest,
                    sysnr: connectionArgs.sysnr,
                    saprouter: connectionArgs.saprouter
                }, {
                    client: connectionArgs.client,
                    lang: connectionArgs.lang,
                    passwd: connectionArgs.passwd,
                    user: connectionArgs.user
                });
            }
            await system.connect();
            if (requiresTrmDependencies) {
                await checkTrmDependencies();
            }
            SystemConnector.systemConnector = system;
        }

        if (requiresRegistry) {
            var registryAlias: RegistryAlias;
            var registry: Registry;
            if (args.registry) {
                registryAlias = RegistryAlias.get(args.registry);
            } else {
                registryAlias = await commands.pickRegistry();
            }
            registry = registryAlias.getRegistry();
            try {
                const registryPing = await registry.ping();
                if (registryPing.wallMessage) {
                    if(registryAuthBlacklist.includes(registryPing.authenticationType)){
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
            if(registryAlias.authData){
                try{
                    await registry.authenticate(registryAlias.authData);
                }catch(e){
                    Logger.error(e, true);
                    Logger.warning(`Registry "${registry.name}" login failed.`);
                }
            }
            CommandRegistry.registry = registry;
        }

        if (commands[args.command]) {
            await commands[args.command](args);
            //force loading clear in case it was left hanging
            if(Logger.logger instanceof CliLogger || Logger.logger instanceof CliLogFileLogger){
                Logger.logger.forceStop();
            }
        } else {
            throw new Error(`Command "${args.command}" doesn't exist.`);
        }

        //Disappear like man was never here!
        process.exit();
    } catch (e) {
        await logError(e);
        process.exit(1);
    }
}