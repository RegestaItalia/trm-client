import { InstallArguments } from "./arguments";
import { InstallPackageReplacements, install as action } from "trm-core";
import { Context, getTempFolder } from "../utils";
import { CommandContext } from "./commons";
import { Logger } from "trm-commons";

const _parsePackageReplacementsArgument = (arg: string): InstallPackageReplacements[] => {
    if (arg) {
        try {
            return JSON.parse(arg);
        } catch (e) { }
    }
}

const _parseImportTimeoutArg = (arg: string): number => {
    if (arg) {
        try {
            return parseInt(arg);
        } catch (e) { }
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
            integrity: commandArgs.integrity,
            registry: CommandContext.getRegistry()
        },
        installData: {
            checks: {
                safe: commandArgs.safe,
                noDependencies: commandArgs.noDependencies,
                noObjectTypes: commandArgs.noObjectTypes,
                noSapEntries: commandArgs.noSapEntries,
                noExistingObjects: commandArgs.overwrite
            },
            import: {
                noLang: commandArgs.noLanguageTransport,
                noCust: commandArgs.noCustomizingTransport,
                timeout: _parseImportTimeoutArg(commandArgs.importTimeout)
            },
            installDevclass: {
                keepOriginal: commandArgs.keepOriginalPackages,
                transportLayer: commandArgs.transportLayer,
                replacements: _parsePackageReplacementsArgument(commandArgs.packageReplacements)
            },
            installTransport: {
                create: commandArgs.createInstallTransport,
                targetSystem: commandArgs.installTransportTargetSys
            }
        }
    });
    var sOutput = `${result.trmPackage.packageName} installed`;
    if (result.installTransport) {
        sOutput += `, use ${result.installTransport.trkorr} transport in landscape`;
    }
    Logger.success(sOutput);
}