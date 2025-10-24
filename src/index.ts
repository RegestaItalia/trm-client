#!/usr/bin/env node
import dotenv from 'dotenv';
import { Command } from "commander";
import { getClientVersion, registerCommand } from "./utils";
import { AuthenticationType } from 'trm-registry-types';

dotenv.config();

const program = new Command();

program
    .name(`trm`)
    .description(`TRM - Transport Request Manager CLI
        
Full documentation available at https://docs.trmregistry.com/

© 2025 RegestaItalia https://www.regestaitalia.eu/`)
    .version(getClientVersion());

/*SYSTEM ALIAS*/
const createAlias = program.command(`createAlias`)
    .argument(`<alias>`, `Name of the alias to generate.`)
    .description(`Create a new system alias.`);
registerCommand(createAlias);
const deleteAlias = program.command(`deleteAlias`)
    .argument(`<alias>`, `Name of the alias to delete.`)
    .description(`Delete a system alias.`);
registerCommand(deleteAlias);
const manageAliases = program.command(`alias`)
    .argument(`[alias]`, `Optional: Single alias to maintain.`)
    .description(`List and manage aliases.`);
registerCommand(manageAliases);

/*REGISTRY*/
const addRegistry = program.command(`addRegistry`)
    .argument(`<registryName>`, `Name of the registry to generate.`)
    .description(`Add a new registry.`)
    .option(`-e, --endpoint <endpoint>`, `Endpoint.`)
    .option(`-a, --authentication <authentication>`, `Authentication as a valid JSON string.`);
registerCommand(addRegistry);
const removeRegistry = program.command(`removeRegistry`)
    .argument(`<registryName>`, `Name of the registry to delete.`)
    .description(`Remove a registry.`)
    .option(`-f, --force`, `Force.`, false);
registerCommand(removeRegistry);
const login = program.command(`login`)
    .description(`Log into a registry.`)
    .addHelpText(`before`, `This command has no effect when trying to login into a registry that doesn't require authentication.`)
    .option(`-f, --force`, `Force login.`, false)
    .option(`-a, --authentication <authentication>`, `Authentication as a valid JSON string.`);
registerCommand(login, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});
const whoami = program.command(`whoami`)
    .description(`Registry logged user data.`)
    .addHelpText(`before`, `This command has no effect when trying to get user info from a registry that doesn't require authentication.`);
registerCommand(whoami, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});
const logout = program.command(`logout`)
    .description(`Log out of a registry.`)
    .addHelpText(`before`, `This command has no effect when trying to logout from a registry that doesn't require authentication.`);
registerCommand(logout, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});

/*PING*/
const ping = program.command(`ping`)
    .description(`Ping trm-server.`);
registerCommand(ping, {
    requiresConnection: true,
    requiresTrmDependencies: true
});

/*PUBLISH*/
const publish = program.command(`publish`)
    .argument(`<package>`, `Name of the package to publish.`)
    .argument(`[version]`, `Optional: Version of the package to publish. If not specified, check help text for details.`)
    .description(`Publish package to registry.`)
    .addHelpText(`before`, `When no version argument is defined, it will automatically set to:
- When it's the first publish: 1.0.0
- When it's already published: the latest available release with patch increased by 1
When it's the first publish, full manifest definition is asked.
When a release is already published, the latest available manifest is used but can be overwritten.
Translation transport is only generated for packages that contain one or more objects with translations (unless skipped by flag).
Customizing transport is only generated if a valid list of customizing transports is provided (unless skipped by flag).
If a default manifest with dependencies is provided in conjunction with the automatic dependency generation, results will be merged.`)
    .option(`-p, --private`, `Publish package with private visibility.`)
    .option(`-np, --noPrompts`, `No prompts (will force some decisions).`, false)
    .option(`-km, --keepLatestReleaseManifestValues`, `Keep the latest release (if exists) manifest values as defaults.`, true)
    .option(`-nl, --noLanguageTransport`, `Skip language (translations) transport publish.`, false)
    .option(`-nd, --noDependenciesDetection`, `Skip automatic dependencies detection.`, false)
    .option(`-sc, --skipCustomizingTransports`, `Skip customizing transports input.`, false)
    .option(`-to, --releaseTimeout <timeout>`, `Publish transports release timeout (in seconds).`, '180')
    .option(`-d, --devclass <devclass>`, `ABAP package to publish.`)
    .option(`-cust, --customizingTransports <customizingTransports>`, `Customizing transports (separated by comma).`)
    .option(`-rm, --readme <readme>`, `Path to file or value of readme.`)
    .option(`-tt, --transportTarget <transportTarget>`, `Publish transports target.`)
    .option(`-bc, --backwardsCompatible`, `Indicates backwards compatibility with older releases.`, true)
    .option(`-sd, --description`, `Short description of the package.`)
    .option(`-gl, --git <link>`, `Git link.`)
    .option(`-wl, --website <link>`, `Website link.`)
    .option(`-pl, --license <license>`, `Package license.`)
    .option(`-pa, --authors <authors>`, `Package authors (separated by comma).`)
    .option(`-pk, --keywords <keywords>`, `Package keywords (separated by comma).`)
    .option(`-pd, --dependencies <JSON>`, `Package dependencies (in JSON format).`)
    .option(`-ps, --sapEntries <JSON>`, `Package SAP entries (in JSON format).`);
registerCommand(publish, {
    requiresConnection: true,
    requiresRegistry: true,
    requiresTrmDependencies: true
});
/*PACK*/
const pack = program.command(`pack`)
    .argument(`<package>`, `Name of the package to generate.`)
    .argument(`[version]`, `Optional: Version of the package to generate. If not specified, check help text for details.`)
    .description(`Save package locally.`)
    .addHelpText(`before`, `When no version is defined, it will automatically set to 1.0.0.
Translation transport is only generated for packages that contain one or more objects with translations (unless skipped by flag).
Customizing transport is only generated if a valid list of customizing transports is provided (unless skipped by flag).
If a default manifest with dependencies is provided in conjunction with the automatic dependency generation, results will be merged.`)
    .option(`-o, --output <<outputPath>>`, `Output path.`)
    .option(`-np, --noPrompts`, `No prompts (will force some decisions).`, false)
    .option(`-nl, --noLanguageTransport`, `Skip language (translations) transport publish.`, false)
    .option(`-nd, --noDependenciesDetection`, `Skip automatic dependencies detection.`, false)
    .option(`-sc, --skipCustomizingTransports`, `Skip customizing transports input.`, false)
    .option(`-to, --releaseTimeout <timeout>`, `Publish transports release timeout (in seconds).`, '180')
    .option(`-d, --devclass <devclass>`, `ABAP package to publish.`)
    .option(`-cust, --customizingTransports <customizingTransports>`, `Customizing transports (separated by comma).`)
    .option(`-tt, --transportTarget <transportTarget>`, `Publish transports target.`)
    .option(`-bc, --backwardsCompatible`, `Indicates backwards compatibility with older releases.`, true)
    .option(`-sd, --description`, `Short description of the package.`)
    .option(`-gl, --git <link>`, `Git link.`)
    .option(`-wl, --website <link>`, `Website link.`)
    .option(`-pl, --license <license>`, `Package license.`)
    .option(`-pa, --authors <authors>`, `Package authors (separated by comma).`)
    .option(`-pk, --keywords <keywords>`, `Package keywords (separated by comma).`)
    .option(`-pd, --dependencies <JSON>`, `Package dependencies (in JSON format).`)
    .option(`-ps, --sapEntries <JSON>`, `Package SAP entries (in JSON format).`);
registerCommand(pack, {
    requiresConnection: true,
    requiresTrmDependencies: true
});

/*UNPUBLISH*/
const unpublish = program.command(`unpublish`)
    .argument(`<package>`, `Name of the package to unpublish from registry.`)
    .argument(`[version]`, `Optional: Version of the package to generate.`, `latest`)
    .description(`Unpublish a package release from registry.`);
registerCommand(unpublish, {
    requiresRegistry: true
});

/*INSTALL*/
const install = program.command(`install`)
    .argument(`<package>`, `Name of the package to install.`)
    .argument(`[version]`, `Optional: Version of the package to install.`, `latest`)
    .description(`Install package from registry into system.`)
    .addHelpText(`before`, `When no version is specified, the latest will be installed.`)
    .option(`-np, --noPrompts`, `No prompts (will force some decisions).`, false)
    .option(`-ow, --overwrite`, `Overwrite installation (allow re-install).`, false)
    .option(`-sf, --safe`, `Safe install (needs package integrity).`, false)
    .option(`-nd, --noDependencies`, `Skip check/install of package dependencies.`, false)
    .option(`-no, --noObjectTypes`, `Skip check of package object types.`, false)
    .option(`-ns, --noSapEntries`, `Skip check of package SAP entries/objects.`, false)
    .option(`-nl, --noLanguageTransport`, `Skip install of language (translations) transport (if exists).`, false)
    .option(`-nc, --noCustomizingTransport`, `Skip install of customizing transport (if exists).`, false)
    .option(`-to, --importTimeout <timeout>`, `Install transports import timeout (in seconds).`, '180')
    .option(`-kd, --keepOriginalPackages`, `Keep original ABAP packages names.`)
    .option(`-it, --createInstallTransport`, `Create/update install transport (used for landscape transports).`, true)
    .option(`-r3, --r3transPath <path>`, `R3trans program path. (default: Environment variable R3TRANS_HOME)`)
    .option(`-sha, --integrity <sha>`, `Package integrity.`)
    .option(`-tl, --transportLayer <transportLayer>`, `ABAP packages transport layer. (default: System default)`)
    .option(`-pr, --packageReplacements <JSON>`, `ABAP package replacements in JSON format.`)
    .option(`-itt, --installTransportTargetSys <transportTarget>`, `Install transport target system.`)
registerCommand(install, {
    requiresConnection: true,
    requiresRegistry: true,
    requiresTrmDependencies: true
});
/*UPDATE*/
const update = program.command(`update`)
    .argument(`[package]`, `Name of the package to update.`)
    .argument(`[version]`, `Optional: Target package version to update.`)
    .description(`Update trm-client / Update package from registry into system.`)
    .addHelpText(`before`, `When no package name is specified, trm-client will self-update. All options are invalid, in this case.
    When no version is specified, the latest will be installed.`)
    .option(`-np, --noPrompts`, `No prompts (will force some decisions).`, false)
    .option(`-sf, --safe`, `Safe install (needs package integrity).`, false)
    .option(`-nd, --noDependencies`, `Skip check/install of package dependencies.`, false)
    .option(`-no, --noObjectTypes`, `Skip check of package object types.`, false)
    .option(`-ns, --noSapEntries`, `Skip check of package SAP entries/objects.`, false)
    .option(`-nl, --noLanguageTransport`, `Skip install of language (translations) transport (if exists).`, false)
    .option(`-nc, --noCustomizingTransport`, `Skip install of customizing transport (if exists).`, false)
    .option(`-to, --importTimeout <timeout>`, `Install transports import timeout (in seconds).`, '180')
    .option(`-kd, --keepOriginalPackages`, `Keep original ABAP packages names.`)
    .option(`-it, --createInstallTransport`, `Create/update install transport (used for landscape transports).`, true)
    .option(`-r3, --r3transPath <path>`, `R3trans program path. (default: Environment variable R3TRANS_HOME)`)
    .option(`-sha, --integrity <sha>`, `Package integrity.`)
    .option(`-tl, --transportLayer <transportLayer>`, `ABAP packages transport layer. (default: System default)`)
    .option(`-pr, --packageReplacements <JSON>`, `ABAP package replacements in JSON format.`)
    .option(`-itt, --installTransportTargetSys <transportTarget>`, `Install transport target system.`)
registerCommand(update, {
    requiresConnection: true,
    requiresRegistry: true,
    requiresTrmDependencies: true
});
/*IMPORT*/
const _import = program.command(`import <file>`)
    .argument(`<file>`, `Path or filename of the TRM package to import.`)
    .description(`Import a package (as a file) into system.`)
    .option(`-np, --noPrompts`, `No prompts (will force some decisions).`, false)
    .option(`-ow, --overwrite`, `Overwrite installation (allow re-install).`, false)
    .option(`-sf, --safe`, `Safe install (needs package integrity).`, false)
    .option(`-nd, --noDependencies`, `Skip check/install of package dependencies.`, false)
    .option(`-no, --noObjectTypes`, `Skip check of package object types.`, false)
    .option(`-ns, --noSapEntries`, `Skip check of package SAP entries/objects.`, false)
    .option(`-nl, --noLanguageTransport`, `Skip install of language (translations) transport (if exists).`, false)
    .option(`-nc, --noCustomizingTransport`, `Skip install of customizing transport (if exists).`, false)
    .option(`-to, --importTimeout <timeout>`, `Install transports import timeout (in seconds).`, '180')
    .option(`-kd, --keepOriginalPackages`, `Keep original ABAP packages names.`)
    .option(`-it, --createInstallTransport`, `Create/update install transport (used for landscape transports).`, true)
    .option(`-r3, --r3transPath <path>`, `R3trans program path. (default: Environment variable R3TRANS_HOME)`)
    .option(`-sha, --integrity <sha>`, `Package integrity.`)
    .option(`-tl, --transportLayer <transportLayer>`, `ABAP packages transport layer. (default: System default)`)
    .option(`-pr, --packageReplacements <JSON>`, `ABAP package replacements in JSON format.`)
    .option(`-itt, --installTransportTargetSys <transportTarget>`, `Install transport target system.`)
registerCommand(_import, {
    requiresConnection: true,
    requiresTrmDependencies: true
});

/*VIEW*/
const view = program.command(`view`)
    .argument(`<package>`, `Name of the package to view.`)
    .description(`View package.`)
    .addHelpText(`before`, `Shows package details.
If the package is not found on the system, it will automatically fall back to the data provided by the registry, granted it exists.`);
registerCommand(view, {
    requiresConnection: true,
    addNoConnection: true, //view registry release only
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});
/*COMPARE*/
const compare = program.command(`compare`)
    .argument(`<package>`, `Name of the package to compare.`)
    .description(`Compare a package on different systems.`)
    .option(`-c, --connections <json>`, `Path to JSON file or JSON containing an array of aliases.`);
registerCommand(compare, {
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});
/*CONTENT*/
const content = program.command(`content`)
    .argument(`<package>`, `Name of the package.`)
    .argument(`[version]`, `Optional: Version of the package`)
    .description(`List content of a package.`)
    .option(`-a, --all`, `List all content`, false)
    .option(`-r3, --r3transPath <path>`, `R3trans program path. (default: Environment variable R3TRANS_HOME)`);
registerCommand(content, {
    requiresRegistry: true
});
/*LIST*/
const list = program.command(`list`)
    .description(`List packages installed on a system.`)
    .option(`-l, --locals`, `List imported/exported local packages`, false);
registerCommand(list, {
    requiresConnection: true
});
/*CHECK TOOLS*/
const check = program.command(`check`)
    .argument(`<package>`, `Name of the package to check.`)
    .description(`Analyze installed package status on a system.`)
    .option(`-at, --analysisType`, `Analysis type (DEPENDENCIES, SAPENTRIES or ALL).`, `DEPENDENCIES`);
registerCommand(check, {
    requiresConnection: true,
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});
const findDependencies = program.command(`findDependencies`)
    .argument(`<devclass>`, `Name of the SAP package to check.`)
    .description(`Find SAP package dependencies with custom packages/trm packages/SAP entries/objects.`)
    .option(`-se, --sapEntries`, `Show list of required SAP entries/objects.`, false)
    .option(`-np, --noPrompts`, `No prompts (will force some decisions).`, false)
registerCommand(findDependencies, {
    requiresConnection: true
});

/*INFO*/
const info = program.command(`info`)
    .description(`TRM Client/Server Info.`);
registerCommand(info, {
    requiresConnection: true,
    addNoConnection: true, //client info only
    requiresTrmDependencies: true
});

/*SETTINGS*/
const settings = program.command(`settings`)
    .description(`Show/Set settings.`)
    .option(`-s, --set <property>`, `Property as KEY=VALUE.`)
registerCommand(settings);


program.parse(process.argv);