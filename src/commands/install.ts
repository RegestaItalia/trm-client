import { InstallArguments } from "./arguments";
import { InstallPackageReplacements, install as action } from "trm-core";
import { Context, getTempFolder } from "../utils";
import { CommandContext } from "./commons";
import { Logger } from "trm-commons";
import * as fs from "fs";
import { Lockfile } from "trm-core/dist/lockfile";

const _parseLockFileArg = (arg: string): Lockfile => {
    if (arg) {
        try {
            arg = fs.readFileSync(arg).toString();
        } catch { }
        try {
            return new Lockfile(JSON.parse(arg));
        } catch { }
    }
}

const _parsePackageReplacementsArg = (arg: string): InstallPackageReplacements[] => {
    if (arg) {
        try {
            return JSON.parse(arg);
        } catch { }
    }
}

const _parseImportTimeoutArg = (arg: string): number => {
    if (arg) {
        try {
            return parseInt(arg);
        } catch { }
    }
}

export async function install(commandArgs: InstallArguments) {
    const packages = await CommandContext.getSystemPackages();
    const result = await action({
        contextData: {
            r3transOptions: {
                tempDirPath: getTempFolder(),
                r3transDirPath: commandArgs.r3transPath,
                useDocker: Context.getInstance().getSettings().r3transDocker,
                dockerOptions: {
                    name: Context.getInstance().getSettings().r3transDockerName
                }
            },
            noInquirer: commandArgs.noPrompts,
            systemPackages: packages,
            noR3transInfo: false //fixed to false
        },
        packageData: {
            name: commandArgs.package,
            version: commandArgs.version,
            overwrite: commandArgs.overwrite,
            registry: CommandContext.getRegistry()
        },
        installData: {
            checks: {
                noDependencies: commandArgs.noDependencies,
                noObjectTypes: commandArgs.noObjectTypes,
                noSapEntries: commandArgs.noSapEntries,
                noExistingObjects: commandArgs.overwrite,
                lockfile: _parseLockFileArg(commandArgs.lockfile)
            },
            import: {
                noLang: commandArgs.noLanguageTransport,
                noCust: commandArgs.noCustomizingTransport,
                timeout: _parseImportTimeoutArg(commandArgs.importTimeout)
            },
            installDevclass: {
                keepOriginal: commandArgs.keepOriginalPackages,
                transportLayer: commandArgs.transportLayer,
                replacements: _parsePackageReplacementsArg(commandArgs.packageReplacements)
            },
            installTransport: {
                create: commandArgs.createInstallTransport,
                targetSystem: commandArgs.installTransportTargetSys
            }
        }
    });
    var sOutput = `${result.manifest.name} v${result.manifest.version} installed`;
    if (result.installTransport) {
        sOutput += `, use ${result.installTransport.trkorr} transport in landscape`;
    }
    Logger.success(sOutput);
}