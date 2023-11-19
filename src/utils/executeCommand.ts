import { CoreEnv, Inquirer, Logger, Registry, SystemConnector } from "trm-core";
import * as commands from "../commands";
import { TraceLevel } from "trm-core";
import { SystemAlias } from "../systemAlias";
import { logError } from "./logError";
import { checkTrmDependencies } from "./checkTrmDependencies";
import { checkCliUpdate } from "./checkCliUpdate";

export async function executeCommand(args: any) {
    var actionArgs: commands.ActionArguments = {};
    try {
        const inquirer = new Inquirer(CoreEnv.CLI);
        actionArgs.inquirer = inquirer;
        const logger = new Logger(CoreEnv.CLI, TraceLevel.TRACE_ALL);
        actionArgs.logger = logger;

        const requiresConnection = args.requiresConnection;
        const requiresTrmDependencies = args.requiresTrmDependencies;
        const requiresRegistry = args.requiresRegistry;
        const registryAuthBlacklist = args.registryAuthBlacklist;
        const ignoreRegistryUnreachable = args.ignoreRegistryUnreachable;

        await checkCliUpdate(logger);

        var system: SystemConnector;
        var registry: Registry;
        if (requiresConnection) {
            if (args.systemAlias) {
                try{
                    system = SystemAlias.get(args.systemAlias, logger).getConnection();
                }catch(e){
                    throw new Error(`Alias not found.`);
                }
            } else {
                const connectionArgs = await commands.connect(args as commands.ConnectArguments, {
                    inquirer
                });
                system = new SystemConnector({
                    ashost: connectionArgs.ashost,
                    dest: connectionArgs.dest,
                    sysnr: connectionArgs.sysnr,
                    saprouter: connectionArgs.saprouter
                }, {
                    client: connectionArgs.client,
                    lang: connectionArgs.lang,
                    passwd: connectionArgs.passwd,
                    user: connectionArgs.user
                }, logger);
            }
            await system.connect(false);
            if (requiresTrmDependencies) {
                await checkTrmDependencies(system);
            }
        }
        actionArgs.system = system;

        if (requiresRegistry) {
            const registryAlias = await commands.pickRegistry({
                inquirer,
                logger
            }, args.registry);
            var registryPing;
            try {
                registry = await registryAlias.getRegistry(false, inquirer, true, false, args.command === 'login');
                actionArgs.registryForcedLogin = registryAlias.getForcedLogin();
                registryPing = await registry.ping();
            } catch (e) {
                if (!ignoreRegistryUnreachable) {
                    throw e;
                }else{
                    registry = await registryAlias.getRegistry(false, inquirer, true, false, true, true);
                }
            }
            if (registryPing) {
                if (registryAuthBlacklist.includes(registryPing.authenticationType)) {
                    throw new Error(`Command ${args.command} is not supported on registry "${registry.name}".`);
                }
            }
        }
        actionArgs.registry = registry;

        if (commands[args.command]) {
            await commands[args.command](args, actionArgs);
        } else {
            throw new Error(`Command ${args.command} doesn't exist.`);
        }
        //Disappear like man was never here!
        process.exit();
    } catch (e) {
        await logError(e, actionArgs);
        process.exit(1);
    }
}