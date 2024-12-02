# Full list of commands

A full list of commands that can be used by trm-client can be found by simply typing

`trm`

in your CLI.

# Logger

By default, the CLI logger is used but every command can be executed with the option

`-log, --logType <logType>`

where `logType` can be one of the following values:

- `CLI`: CLI logger with colored informations
- `CLI_LOG`: Same as the CLI logger but will save the log output to a file
- `CONSOLE`: Simple logger
- `VOID`: No logger

## Debug data

To enable logging of debug data, add this option

`-dbg, --debug`

to any command.

> It's recommended to log debug data only if needed, as, depending on the command, the output can be quite long.

# Client/Server info or configuration

## Client settings

Show or edit setting values.

These settings will overwrite default values.

Settings are saved in **plain text** in the AppData `settings.ini` file.

Possible settings are:

- `loggerType`: Default logger
- `logOutputFolder`: Default log file output folder

- Command `settings`
- Options
    - `-s, --set <property>` - `string`
		
		Set a value in the form of KEY=VALUE

## Client/Server versions

Show installed client/server versions.

- Command `info`
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.

# System alias

Because a connection to an SAP ECC/S4 system has a quite a few parameters, connecting to a system by typing all of them via CLI can be challenging.

To solve this problem, you can create a system alias.

A system alias is an easy way to store all of the connection attributes, including login data, of an SAP ECC/S4 system.

System aliases are saved in **plain text** in the AppData `systems.ini` file.

Generally, all commands that require a connection to a system have the option

`-a, --systemAlias <systemAlias>`

where, once an alias is saved, can be used to quickly connect to a system.


## Manage alias

List and manage aliases.

- Command `trm alias`
- Options
    - `-a, --systemAlias <SYSTEM_ALIAS>` - `string`
		
		Alias to manage.
		
## Create alias

Create a new system alias.

- Command `createAlias <alias>`
- Parameters
	- `alias` - `string`
		
		Name of the alias to create. Alias names are unique.
		
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.
		
## Delete alias

Delete alias.

- Command `deleteAlias <alias>`
- Parameters
	- `alias` - `string`
		
		Name of the alias to delete.
		
# Registry

Similar to [system aliases](#system-alias), connections to registries can be saved in **plain text** in the AppData `registry.ini` file.

Generally, all commands that require a connection to a registry have the option

`-r, --registry <registry>`

where, once a registry is saved, can be used to quickly connect.

> By default, and if no other registry is added, trm will use the public registry.

All new registries are considered **private registries**.

## Add registry

Create a new registry connection.

- Command `addRegistry <registryName>`
- Parameters
	- `registryName` - `string`
		
		Name of the registry to create. Registry names are unique.
		
- Options
    - `-e, --endpoint <endpoint>` - `string`
		
		Registry endpoint.
		
	- `-a, --authentication <authentication>` - `JSON`
		
		Authentication data.
		
> "public" is a reserved keyword and can't be used as a new registry name.

## Remove registry

Remove a registry connection.

Create a new registry connection.

- Command `removeRegistry <registryName>`
- Parameters
	- `registryName` - `string`
		
		Name of the registry to remove.
		
- Options
    - `-f, --force` - `boolean`
		
		Force remove (skip confirmation prompt).
		
## Login

Log into registry.

If no private registries were added, it will default to the public registry.

- Command `login`
- Options
	- `-r, --registry <registry>` - `string`
		
		Registry name.
		
    - `-f, --force` - `boolean`
		
		Force login (ignore if you're already logged in).
		
	- `-a, --authentication <authentication>` - `JSON`
		
		Authentication data.

> This command has no effect when trying to login into a registry that doesn't require authentication.

## User data

Get currently logged in user data.

If no private registries were added, it will default to the public registry.

- Command `whoami`
- Options
	- `-r, --registry <registry>` - `string`
		
		Registry name.

> This command has no effect when trying to get user info from a registry that doesn't require authentication.

## Logout

Log out of a registry.

If no private registries were added, it will default to the public registry.

- Command `logout`
- Options
	- `-r, --registry <registry>` - `string`
		
		Registry name.

> This command has no effect when trying to logout from a registry that doesn't require authentication.

# Packages

Generally, all packages related commands require both a connection to a system and a registry.

## List installed packages

List all the packages installed on a system.

- Command `list`

> This command doesn't require trm-server installed on the system.

## View package data

View package data (manifest values).

- Command `view <package>`
- Parameters
	- `package` - `string`
		
		Name of the package.
		
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.
		
	- `-a, --systemAlias <systemAlias>` - `string`
		
		System alias.
		
	- `-r, --registry <registry>` - `string`
		
		Registry (default: **public**).
		
> This command doesn't require trm-server installed on the system.

> If the package is not found on the system, it will automatically fall back to the data provided by the registry, granted it exists.

## Compare package between different systems

Compare the same package on one or more systems.

- Command `compare <package>`
- Parameters
	- `package` - `string`
		
		Name of the package.
		
- Options
	- `-r, --registry <registry>` - `string`
		
		Registry (default: **public**).
	
	- `-c, --connections <json>` - `JSON`
		
		Path to JSON file or string with array of aliases to compare.

> This command doesn't require trm-server installed on the system.

## Publish package release

Publish a new package release on the registry.

When no version is defined, it will automatically set to:

- When it's the first release ever: 1.0.0
- When it's already published: the latest available released with patch increased by 1

When it's the first publish, full manifest definition is asked (unless running with flags that will disable it).

When a release is already published, the latest available manifest is used and no overwrite is expected (unless specified by flags).

Translation transport is only generated for packages that contain one or more objects with translations (unless skipped by flags).

Customizing transport is only generated if a valid list of customizing transports is provided (unless skipped by flags).

If a default manifest with dependencies is provided in conjunction with the automatic dependency generation, results will be merged.

- Command `publish <package> [version]`
- Parameters
	- `package` - `string`
		
		Name of the package to publish. If registry uses authentication, the user must be authorized to publish a release under this package name.
		
	- `version` - `string`
		
		Version of the release (default: check description above).
		
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.
		
	- `-a, --systemAlias <systemAlias>` - `string`
		
		System alias.
		
	- `-r, --registry <registry>` - `string`
		
		Registry (default: **public**).
		
	- `-d, --devclass <devclass>` - `string`
		
		Devclass (SAP package) that contains user custom developments to publish.
		
	- `-t, --target <target>` - `string`
		
		TMS Target (Used for transport release).
		
	- `-m, --manifest <manifestJson>` - `string`
		
		Path to JSON file or JSON string containing manifest publish default values.
		
	- `-rm, -readme <readme>` - `string`
		
		Path to or text containing the package default value for the readme.
		
	- `-fm, --forceManifest` - `boolean`
		
		Force manifest prompt even when it's not required (default: **false**). Has no effect with silent flag.
		
	- `-sl, --skipLang` - `boolean`
		
		Skip translation transport (default: **false**).
		
	- `-sc, --skipCustomizing` - `boolean`
		
		Skip customizing transport (default: **false**).
		
	- `-ct, --customizingTransports` - `string`
		
		Customizing transports to include, separated by comma. Only root transports are required, tasks are automatically included.
		
	- `-sd, --skipDependencies` - `boolean`
		
		Skip automatic dependencies search (default: **false**).
		
	- `-ses, --skipEditSapEntries` - `boolean`
		
		Skip SAP entries edit prompt (default: **false**). Has no effect with silent flag.
		
	- `-sed, --skipEditDependencies` - `boolean`
		
		Skip dependencies edit prompt (default: **false**). Has no effect with silent flag.
		
	- `-srm, --skipReadme` - `boolean`
		
		Skip readme prompt (default: **false**). Has no effect with silent flag.
		
	- `-s, --silent` - `boolean`
		
		No manual inputs (default: **false**).
		
	- `-to, --releaseTimeout <timeout>` - `number`
		
		Release timeout (in seconds) (default: **180**).
	
## Unpublish package from registry

Unpublish a release of a package from its registry.

- Command `unpublish <package> <version>`
- Parameters
	- `package` - `string`
		
		Name of the package.
		
	- `version` - `string`
		
		Release version to unpublish.
		
- Options
	- `-r, --registry <registry>` - `string`
		
		Registry (default: **public**).
		
## Install package release

Install a package release into a system.

This command won't let you update/downgrade a package unless specified differently with the appropriate flag.

- Command `install <package> [version]`
- Parameters
	- `package` - `string`
		
		Name of the package to install. If registry uses authentication, the user must be authorized to view this package.
		
	- `version` - `string`
		
		Version of the release (default: **latest**).
		
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.
		
	- `-a, --systemAlias <systemAlias>` - `string`
		
		System alias.
		
	- `-r, --registry <registry>` - `string`
		
		Registry (default: **public**).
		
	- `-tl, --transportLayer <transportLayer>` - `string`
		
		Transport layer used for package generation (default: **System default**).
		
	- `-f, --force` - `boolean`
		
		Force install of the package: no checks on dependencies/SAP Entries or object types, overwrites if already exists (default: **false**).
		
	- `-k, --keepOriginals` - `boolean`
		
		Keep original package names (no checks if a package with the same name already exists) (default: **false**).
		
	- `-to, --importTimeout <timeout>` - `number`
		
		Import timeout (in seconds) (default: **180**).
		
	- `-wg, --workbenchGen` - `boolean`
		
		Generate a workbench transport containing the package for later transport in the landscape (default: **true**).
		
	- `-ss, --skipSapEntries` - `boolean`
		
		Skip SAP Entries check (default: **false**). Has no effect with flag force.
	
	- `-so, --skipObjectsCheck` - `boolean`
		
		Skip object types check (default: **false**). Has no effect with flag force.
		
	- `-sl, --skipLang` - `boolean`
		
		Skip translation transport (default: **false**).
		
	- `-sc, --skipCustomizing` - `boolean`
		
		Skip customizing transport (default: **false**).
		
	- `-sd, --skipDependencies` - `boolean`
		
		Skip dependencies (default: **false**). Has no effect with flag force.
		
	- `-wt, --workbenchTarget <target>` - `string`
		
		Workbench transport target system. Only used if workbench transport is set to generate (default: **none**).
		
	- `-s, --silent` - `boolean`
		
		No manual inputs (default: **false**).
		
	- `-pr, --packageReplacements <mapJson>` - `JSON`
		
		Path to JSON file or JSON string containing package replacement map.
		
		In order to be valid, the JSON must be an array of objects with the following properties:
			
			- `originalDevclass` - `string`
				
				Name of the original devclass.
				
			- `installDevclass` - `string`
				
				Name of the target devclass.
		
		If one or more devclass has no replacement found in the array, you'll be prompted for a value.
		
	- `-ra, --replaceAllowed` - `boolean`
		
		Allow package update/downgrade (default: **false**). Has no effect with flag force.
		
## Update package

Upgrade/downgrade package.

Has the same affect as [Install package release](#install-package-release) with the `-ra, --replaceAllowed` flag set to `true`.

- Command `update <package> [version]`
- Parameters refer to [Install package release](#install-package-release)
- Options refer to [Install package release](#install-package-release)

# Tools

These commands can be useful before installing or publishing a package release.

## Ping

Ping `trm-server` on a system: if setup correctly, you should see a `PONG` response.

- Command `ping`
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.
		
	- `-a, --systemAlias <systemAlias>` - `string`
		
		System alias.
		
## Analyze package status

Analyze dependencies and/or SAP entries of a package.

- Command `check <package>`
- Parameters
	- `package` - `string`
		
		Name of the package to analyze.
		
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.
		
	- `-a, --systemAlias <systemAlias>` - `string`
		
		System alias.
		
	- `-r, --registry <registry>` - `string`
		
		Registry (default: **public**).
		
	- `-at, --analysisType` - `string`
		
		Analysis type. Possible values are `DEPENDENCIES`, `SAPENTRIES` and `ALL`.
		
## Find package dependencies

Find dependencies of an SAP package with other packages/trm packages/SAP Entries.

- Command `findDependencies <devclass>`
- Parameters
	- `devclass` - `string`
		
		Devclass (SAP package) that contains user custom developments.
		
- Options
    - `-de, --dest <dest>` - `string`
		
		System ID.
		
	- `-ah, --ashost <ashost>` - `string`
		
		System application server address.
		
	- `-sn, --sysnr <sysnr>` - `string`
		
		System instance number.
		
	- `-sr, --saprouter <sapRouter>` - `string`
		
		System SAPRouter string.
		
	- `-cl, --client <client>` - `string`
		
		System logon client.
		
    - `-us, --user <user>` - `string`
		
		System logon user.
		
	- `-pw, --passwd <passwd>` - `string`
		
		System logon password.
		
	- `-a, --systemAlias <systemAlias>` - `string`
		
		System alias.
		
	- `-se, --sapEntries` - `boolean`
		
		Include SAP entries dependencies (default: **false**).
		
