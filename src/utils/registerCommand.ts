import { Argument, Command } from "commander";
import { executeCommand } from "./executeCommand";
import { AuthenticationType } from "trm-registry-types";

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
    if (requiresConnection || commandName === 'createAlias') { //hardcode to avoid...
        command.option(`-d, --dest <dest>`, `System ID`)
            .option(`-u, --user <user>`, `System User Logon`)
            .option(`-p, --passwd <passwd>`, `System User Logon Password`)
            .option(`-c, --client <client>`, `System Logon Client`)
            .option(`-l, --lang <lang>`, `System User Logon Language`)
            .option(`-h, --ashost <ashost>`, `System application server address`)
            .option(`-s, --sapRouter <sapRouter>`, `System SAP Router string`)
            .option(`-n, --sysnr <sysnr>`, `System instance number`);
        if (!noSystemAlias) {
            command.option(`-a, --systemAlias <systemAlias>`, `System Alias`);
        }
    }
    if(requiresRegistry){
        command.option(`-r, --registry <registry>`, `Registry`);
    }
    command.option('-log, --log-type', 'Log type', 'cli');

    command.action(async (arg1, arg2) => {
        var args = {
            command: commandName,
            requiresConnection,
            requiresTrmDependencies,
            requiresRegistry,
            registryAuthBlacklist,
            noSystemAlias,
            ignoreRegistryUnreachable
        };
        if(!arg1){
            arg1 = {};
        }
        if(!arg2){
            arg2 = {};
        }
        if(typeof(arg1) === 'string'){
            const requiredArg = command["_args"].find((o: Argument) => o.required);
            args[requiredArg.name()] = arg1;
            args = {...args, ...arg2};
        }else{
            args = {...args, ...arg1};
        }
        await executeCommand(args);
    });
}