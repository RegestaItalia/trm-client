#!/usr/bin/env node
import 'dotenv/config';
import { Command } from "commander";
import { getClientVersion, registerCommand } from "./utils";
import { AuthenticationType } from 'trm-registry-types';

const program = new Command();

program
    .name(`trm`)
    .description(`TRM - Transport Request Manager CLI`)
    .version(getClientVersion());

/*SYSTEM ALIAS*/
const createAlias = program.command(`createAlias <alias>`)
    .description(`Create a new system alias.`);
registerCommand(createAlias, {
    noSystemAlias: true,
});
const deleteAlias = program.command(`deleteAlias <alias>`)
    .description(`Delete a system alias`);
registerCommand(deleteAlias);
const manageAliases = program.command(`alias`)
    .description(`List and manage aliases`)
    .option(`-a, --systemAlias <systemAlias>`, `System Alias.`);
registerCommand(manageAliases);

/*REGISTRY*/
const addRegistry = program.command(`addRegistry <registry>`)
    .description(`Add a new registry`)
    .option(`-e, --endpoint <endpoint>`, `Endpoint.`)
    .option(`-a, --authentication <authentication>`, `Authentication as a valid JSON string.`);
registerCommand(addRegistry);
const removeRegistry = program.command(`removeRegistry <registry>`)
    .description(`Removes a registry`)
    .option(`-f, --force`, `Force.`, false);
registerCommand(removeRegistry);
const login = program.command(`login`)
    .description(`Log into the registry.`)
    .option(`-f, --force`, `Force.`, false)
    .option(`-a, --authentication <authentication>`, `Authentication as a valid JSON string.`);
registerCommand(login, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});
const whoami = program.command(`whoami`)
    .description(`Registry user data.`);
registerCommand(whoami, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});
const logout = program.command(`logout`)
    .description(`Log out of the registry`);
registerCommand(logout, {
    requiresRegistry: true,
    registryAuthBlacklist: [AuthenticationType.NO_AUTH]
});

/*PING*/
const ping = program.command(`ping`)
    .description(`Test trm-server with ping RFC function`);
registerCommand(ping, {
    requiresConnection: true,
    requiresTrmDependencies: true
});

/*PUBLISH*/
const publish = program.command(`publish <package>`)
    .description(`Publish package to registry`)
    .option(`-d, --devclass <devclass>`, `Devclass.`)
    .option(`-v, --version <version>`, `Version. Allowed values are either "latest" or a semver valid version.`, "latest")
    .option(`-t, --target <target>`, `TMS Target.`)
    .option(`-m, --manifest <json>`, `Path to JSON file or JSON containing the manifest values.`)
    .option(`-rm, --readme <markdown>`, `Path to MD file or markdown containing the package README.`)
    .option(`-fm, --forceManifest`, `Force manifest input values, even when a package has already been published.`, false)
    .option(`-om, --overwriteManifest`, `Overwrite existing manifest values when input is provided.`, true)
    .option(`-sd, --skipDependencies`, `Skip searching for dependencies.`, false)
    .option(`-ses, --skipEditSapEntries`, `Skip SAP entries edit prompt.`, false)
    .option(`-sed, --skipEditDependencies`, `Skip dependencies edit prompt.`, false)
    .option(`-srm, --skipReadme`, `Skip readme prompt.`, false)
    .option(`-ci, --ci`, `Flag used to avoid unnecessary prompts.`, false)
    .option(`-to, --releaseTimeout <timeout>`, `Release timeout (in seconds).`, '180');
registerCommand(publish, {
    requiresConnection: true,
    requiresRegistry: true,
    requiresTrmDependencies: true
});

/*UNPUBLISH*/
const unpublish = program.command(`unpublish <package>`)
    .description(`Unpublish package from registry`)
    .option(`-v, --version <version>`, `REQUIRED - Version to unpublish.`,);
registerCommand(unpublish, {
    requiresRegistry: true
});

/*INSTALL*/
const install = program.command(`install <package>`)
    .description(`Install package`)
    .option(`-v, --version <version>`, `Version. Allowed values are either "latest" or a semver valid version.`, "latest")
    .option(`-f, --force`, `Force install.`, false)
    .option(`-ci, --ci`, `Clean install, flag used to avoid unnecessary prompts.`, false)
    .option(`-to, --importTimeout <timeout>`, `Import timeout (in seconds).`, '180')
    .option(`-is, --ignoreSapEntries`, `Ignore missing SAP entries.`, false)
    .option(`-sd, --skipDependencies`, `Skip dependencies install.`, false)
    .option(`-swb, --skipWorkbenchTransport`, `Skip workbench transport generation.`, false)
    .option(`-k, --keepOriginalPackages`, `Keep original packages.`, false)
    .option(`-pr, --packageReplacements`, `Path to JSON file or JSON containing package replacements.`)
    .option(`-ts, --targetSystem`, `Generated transport target system.`)
    .option(`-tl, --transportLayer`, `Devclass transport layers.`);
registerCommand(install, {
    requiresConnection: true,
    requiresRegistry: true,
    requiresTrmDependencies: true
});

/*VIEW*/
const view = program.command(`view <package>`)
    .description(`View package`);
registerCommand(view, {
    requiresConnection: true,
    requiresRegistry: true
});
/*COMPARE*/
const compare = program.command(`compare <package>`)
    .description(`Compare a package on different systems`)
    .option(`-c, --connections <json>`, `Path to JSON file or JSON containing an array of aliases.`);
registerCommand(compare, {
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});
/*LIST*/
const list = program.command(`list`)
    .description(`List packages in a system`);
registerCommand(list, {
    requiresConnection: true
});
/*CHECK*/
const check = program.command(`check <package>`)
    .description(`Check installed package`);
    //.option(`-e, --extended`, `Show full list of SAP entries and dependencies.`, false);
registerCommand(check, {
    requiresConnection: true,
    requiresRegistry: true,
    ignoreRegistryUnreachable: true
});

/*INFO*/
const info = program.command(`info`)
    .description(`TRM Client/Server Info`);
registerCommand(info, {
    requiresConnection: true,
    requiresTrmDependencies: true
});



program.parse(process.argv);