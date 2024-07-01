import { Command } from "commander";
import { executeCommand } from "./executeCommand";
import { AuthenticationType } from "trm-registry-types";
import { Settings } from "../settings";

export function registerCommand(command: Command, args?: {
    requiresConnection?: boolean, //sets connection arguments
    requiresTrmDependencies?: boolean,
    requiresRegistry?: boolean,
    registryAuthBlacklist?: AuthenticationType[],
    noSystemAlias?: boolean, //skips alias creation during connection
    ignoreRegistryUnreachable?: boolean
}) {
    const commandName = command.name();

    if(!args){
        args = {};
    }
    const requiresConnection = args.requiresConnection ? true : false;
    const requiresTrmDependencies = args.requiresTrmDependencies ? true : false;
    const requiresRegistry = args.requiresRegistry ? true : false;
    const ignoreRegistryUnreachable = args.ignoreRegistryUnreachable ? true : false;
    const noSystemAlias = args.noSystemAlias ? true : false;
    const registryAuthBlacklist = args.registryAuthBlacklist || [];
    const defaultLogger = Settings.getInstance().data.loggerType;
    const logOutputFolder = Settings.getInstance().data.logOutputFolder;

    if (requiresConnection || commandName === 'createAlias') { //hardcode to avoid...
        command.option(`-de, --dest <dest>`, `System ID.`)
            .option(`-us, --user <user>`, `System User Logon.`)
            .option(`-pw, --passwd <passwd>`, `System User Logon Password.`)
            .option(`-cl, --client <client>`, `System Logon Client.`)
            .option(`-la, --lang <lang>`, `System User Logon Language.`, 'EN')
            .option(`-ah, --ashost <ashost>`, `System application server address.`)
            .option(`-sr, --saprouter <sapRouter>`, `System SAP Router string.`)
            .option(`-sn, --sysnr <sysnr>`, `System instance number.`);
        if (!noSystemAlias) {
            command.option(`-a, --systemAlias <systemAlias>`, `System Alias.`);
        }
    }
    if(requiresRegistry){
        command.option(`-r, --registry <registry>`, `Registry name.`);
    }
    command.option(`-log, --logType <logType>`, `Log type.`, defaultLogger);
    command.option(`-v, --verbose`, `Verbose logging.`, false);

    command.action(async (arg1, arg2) => {
        var args = {...{
            command: commandName,
            requiresConnection,
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
        await executeCommand(args);
    });
}