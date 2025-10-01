import { Command } from "commander";
import { executeCommand } from "./executeCommand";
import { AuthenticationType } from "trm-registry-types";
import { Context } from "./Context";

export function registerCommand(command: Command, args?: {
    requiresConnection?: boolean, //sets connection arguments
    addNoConnection?: boolean, //add no connection option (needs connection)
    requiresTrmDependencies?: boolean, //don't execute if trm dependencies arent met (needs connection)
    requiresRegistry?: boolean, //don't execute without connection to registry
    registryAuthBlacklist?: AuthenticationType[], //skip registry requirement if matches authentication type
    noSystemAlias?: boolean, //skips alias creation during connection
    ignoreRegistryUnreachable?: boolean, //allow execution if connection to the registry fails (needs registry)
}) {
    const commandName = command.name();

    if(!args){
        args = {};
    }
    const requiresConnection = args.requiresConnection ? true : false;
    const addNoConnection = args.addNoConnection ? true : false;
    const requiresTrmDependencies = args.requiresTrmDependencies ? true : false;
    const requiresRegistry = args.requiresRegistry ? true : false;
    const ignoreRegistryUnreachable = args.ignoreRegistryUnreachable ? true : false;
    const noSystemAlias = args.noSystemAlias ? true : false;
    const registryAuthBlacklist = args.registryAuthBlacklist || [];
    const defaultLogger = Context.getInstance().getSettings().loggerType;
    const logOutputFolder = Context.getInstance().getSettings().logOutputFolder;

    if (requiresConnection) {
        command.option(`-de, --dest <dest>`, `System ID.`)
            .option(`-us, --user <user>`, `System User Logon.`)
            .option(`-pw, --passwd <passwd>`, `System User Logon Password.`)
            .option(`-cl, --client <client>`, `System Logon Client.`)
            .option(`-la, --lang <lang>`, `System User Logon Language.`)
            .option(`-ah, --ashost <ashost>`, `System application server address.`)
            .option(`-sr, --saprouter <sapRouter>`, `System SAP Router string.`)
            .option(`-sn, --sysnr <sysnr>`, `System instance number.`)
            .option(`-ep, --endpoint <endpoint>`, `System REST endpoint.`)
            .option(`-fd, --forwardRfcDest <forwardRfcDest>`, `System REST forward destination.`, `NONE`);
        if (!noSystemAlias) {
            command.option(`-a, --systemAlias <systemAlias>`, `System Alias.`);
        }
    }
    if(requiresRegistry){
        command.option(`-r, --registry <registry>`, `Registry name.`);
        command.option(`-re, --registryEndpoint <endpoint>`, `Registry endpoint.`);
        command.option(`-ra, --registryAuth <authentication>`, `Registry authentication (in JSON format).`);
    }
    command.option(`-log, --logType <logType>`, `Log type.`, defaultLogger);
    command.option(`-dbg, --debug`, `Debug logging.`, false);

    command.action(async (arg1, arg2) => {
        var args = {...{
            command: commandName,
            checkUpdate: true,
            requiresConnection,
            addNoConnection,
            requiresTrmDependencies,
            requiresRegistry,
            registryAuthBlacklist,
            noSystemAlias,
            ignoreRegistryUnreachable,
            logOutputFolder
        }, ...(command['_optionValues'] || {})};

        if(!arg1){
            arg1 = {};
        }
        if(!arg2){
            arg2 = {};
        }
        if(typeof(arg1) === 'string'){
            const oArg1 = command["_args"][0];
            args[oArg1.name()] = arg1;
            if(typeof(arg2) === 'string'){
                const oArg2 = command["_args"][1];
                args[oArg2.name()] = arg2;
            }else{
                args = {...args, ...arg2};
            }
        }else{
            args = {...args, ...arg1};
        }
        if(args.command === 'update' && !args.package){ // hardcode to keep command update for both trm packages and self-update
            args.command = 'selfUpdate';
            delete args.requiresConnection;
            delete args.requiresRegistry;
            delete args.requiresTrmDependencies;
            delete args.checkUpdate;
        }
        await executeCommand(args);
    });
}