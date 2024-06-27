#!/usr/bin/env node
import 'dotenv/config';
import { Command } from "commander";
import { getClientVersion, registerCommand } from "./utils";
import { AuthenticationType } from 'trm-registry-types';

const program = new Command();

program
    .name(`trm`)
    .description(`TRM - Transport Request Manager CLI`)
    .version(getClientVersion(), `-cv, --clientVersion`, `Client version`);

/*SYSTEM ALIAS*/
const createAlias = program.command(`createAlias <alias>`) //OK
    .description(`Create a new system alias`);
registerCommand(createAlias, {
    noSystemAlias: true,
});
const deleteAlias = program.command(`deleteAlias <alias>`) //OK
    .description(`Delete a system alias`);
registerCommand(deleteAlias);
const manageAliases = program.command(`alias`) //OK
    .description(`List and manage aliases`)
    .option(`-a, --systemAlias <systemAlias>`, `System Alias.`);
registerCommand(manageAliases);

/*REGISTRY*/
const addRegistry = program.command(`addRegistry <registryName>`) //OK
    .description(`Add a new registry`)
    .option(`-e, --endpoint <endpoint>`, `Endpoint.`)
    .option(`-a, --authentication <authentication>`, `Optional authentication as a valid JSON string.`);
registerCommand(addRegistry);
const removeRegistry = program.command(`removeRegistry <registryName>`) //OK
    .description(`Remove a registry`)
    .option(`-f, --force`, `Force.`, false);
registerCommand(removeRegistry);
const login = program.command(`login`) //OK
    .description(`Log into a registry`)
    .addHelpText(`before`, `This command has no effect when trying to login into a registry that doesn't require authentication.`)
    .option(`-f, --force`, `Force login.`, false)
    .option(`-a, --authentication <authentication>`, `Authentication as a valid JSON string.`);
registerCommand(login, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});
const whoami = program.command(`whoami`) //OK
    .description(`Registry logged user data`)
    .addHelpText(`before`, `This command has no effect when trying to get user info from a registry that doesn't require authentication.`);
registerCommand(whoami, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});
const logout = program.command(`logout`) //OK
    .description(`Log out of a registry`)
    .addHelpText(`before`, `This command has no effect when trying to logout from a registry that doesn't require authentication.`);
registerCommand(logout, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});

/*PING*/
const ping = program.command(`ping`) //OK
    .description(`Test trm-server with ping RFC function`);
registerCommand(ping, {
    requiresConnection: true,
    requiresTrmDependencies: true
});

/*PUBLISH*/
const publish = program.command(`publish <package> [version]`) //OK
    .description(`Publish package to registry`)
    .addHelpText(`before`, `When no version is defined, it will automatically set to:
- When it's the first release ever: 1.0.0
- When it's already published: the latest available released with patch increased by 1
When it's the first publish, full manifest definition is asked (unless running with flags that will disable it).
When a release is already published, the latest available manifest is used and no overwrite is expected (unless specified by flags).
Translation transport is only generated for packages that contain one or more objects with translations (unless skipped by flags).
Customizing transport is only generated if a valid list of customizing transports is provided (unless skipped by flags).
If a default manifest with dependencies is provided in conjunction with the automatic dependency generation, results will be merged.`)
    .option(`-d, --devclass <devclass`, `Devclass (SAP package) that contains user custom developments to publish. `)
    .option(`-t, --target <target>`, `TMS Target (Used for transport release).`)
    .option(`-m, --manifest <manifestJson>`, `Path to JSON file or JSON string containing manifest publish default values.`)
    .option(`-rm, -readme <readme>`, `Path to or text containing the package default value for the readme.`)
    .option(`-fm, --forceManifest`, `Force manifest prompt even when it's not required.`, false)
    .option(`-sl, --skipLang`, `Skip translation transport.`, false)
    .option(`-sc, --skipCustomizing`, `Skip customizing transport.`, false)
    .option(`-ct, --customizingTransports`, `Customizing transports to include, separated by comma. Only root transports are required, tasks are automatically included.`)
    .option(`-sd, --skipDependencies`, `Skip automatic dependencies search.`, false)
    .option(`-ses, --skipEditSapEntries`, `Skip SAP entries edit prompt.`, false)
    .option(`-sed, --skipEditDependencies`, `Skip dependencies edit prompt.`, false)
    .option(`-srm, --skipReadme`, `Skip readme prompt.`, false)
    .option(`-s, --silent`, `No manual inputs`, false)
    .option(`-to, --releaseTimeout <timeout>`, `Release timeout (in seconds).`, '180');
registerCommand(publish, {
    requiresConnection: true,
    requiresRegistry: true,
    requiresTrmDependencies: true
});

/*UNPUBLISH*/
const unpublish = program.command(`unpublish <package> <version>`) //OK
    .description(`Unpublish a package release from registry`);
registerCommand(unpublish, {
    requiresRegistry: true
});

/*INSTALL*/
const install = program.command(`install <package> [version]`) //OK
    .description(`Install package from registry to system`)
    .addHelpText(`before`, `When no version is specified, the latest will be installed.
This command won't let you update/downgrade a package unless specified differently with the appropriate flag.`)
    .option(`-tl, --transportLayer <transportLayer>`,`Transport layer used for package generation. (default: System default)`)
    .option(`-f, --force`, `Force install of the package: no checks on dependencies/SAP Entries or object types, overwrites if already exists`, false)
    .option(`-k, --keepOriginals`, `Keep original package names (no checks if a package with the same name already exists)`, false)
    .option(`-to, --importTimeout <timeout>`, `Import timeout (in seconds)`, '180')
    .option(`-wg, --workbenchGen`, `Generate a workbench transport containing the package for later transport in the landscape`, true)
    .option(`-ss, --skipSapEntries`, `Skip SAP Entries check  (has no effect with flag force)`, false)
    .option(`-so, --skipObjectsCheck`, `Skip object types check  (has no effect with flag force)`, false)
    .option(`-sl, --skipLang`, `Skip translation transport`, false)
    .option(`-sc, --skipCustomizing`, `Skip customizing transport`, false)
    .option(`-sd, --skipDependencies`, `Skip dependencies (has no effect with flag force)`, false)
    .option(`-wt, --workbenchTarget <target>`, `Workbench transport target system. Only used if workbench transport is set to generate (default: None)`)
    .option(`-s, --silent`, `No manual inputs`, false)
    .option(`-pr, --packageReplacements <mapJson>`, `Path to JSON file or JSON string containing package replacement map`)
    .option(`-ra, --replaceAllowed`, `Allow package update/downgrade  (has no effect with flag force)`, false);
registerCommand(install, {
    requiresConnection: true,
    requiresRegistry: true,
    requiresTrmDependencies: true
});

/*VIEW*/
const view = program.command(`view <package>`) //OK
    .description(`View package`)
    .addHelpText(`before`, `Shows package details.
If the package is not found on the system, it will automatically fall back to the data provided by the registry, granted it exists.`);
registerCommand(view, {
    requiresConnection: true,
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});
/*COMPARE*/
const compare = program.command(`compare <package>`) //OK
    .description(`Compare a package on different systems`)
    .option(`-c, --connections <json>`, `Path to JSON file or JSON containing an array of aliases.`);
registerCommand(compare, {
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});
/*LIST*/
const list = program.command(`list`) //OK
    .description(`List packages installed on a system`);
registerCommand(list, {
    requiresConnection: true
});
/*CHECK TOOLS*/
const check = program.command(`check <package>`) //OK
    .description(`Analyze installed package status on a system`)
    .option(`-at, --analysisType`, `Analysis type`);
registerCommand(check, {
    requiresConnection: true,
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});
const findDependencies = program.command(`findDependencies <devclass>`)
    .description(`Find SAP package dependencies with custom packages/trm packages/SAP Entries`)
    .option(`-se, --sapEntries`, `Show list of required SAP Entries`, false)
registerCommand(findDependencies, {
    requiresConnection: true
});

/*INFO*/
const info = program.command(`info`) //OK
    .description(`TRM Client/Server Info`);
registerCommand(info, {
    requiresConnection: true,
    requiresTrmDependencies: true
});



program.parse(process.argv);