import { Package } from "trm-registry-types";
import { CommandContext } from "./CommandContext";
import chalk from "chalk";
import { Logger } from "trm-commons";

export async function viewRegistryPackage(packageName: string, print: boolean = true): Promise<Package> {
    Logger.loading(`Reading registry data...`);
    var oRegistryView: Package;
    try {
        oRegistryView = await CommandContext.getRegistry().getPackage(packageName, 'latest');
    } catch (e) {
        Logger.error(e, true);
        oRegistryView = null;
    }
    if (print) {
        if (!oRegistryView) {
            Logger.warning(`${chalk.bold('WARNING')}: This package was not found on the registry.`);
            Logger.warning(`${chalk.bold('WARNING')}: This package may have been deleted!`);
        } else {
            if (oRegistryView.deprecated) {
                if (oRegistryView.deprecated_message) {
                    Logger.warning(`${chalk.bold('WARNING deprecate')}: ${oRegistryView.deprecated_message}`);
                } else {
                    Logger.warning(`${chalk.bold('WARNING deprecate')}: v${oRegistryView.manifest.version} is deprecated`);
                }
            }
        }
    }
    return oRegistryView;
}