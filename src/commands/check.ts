import { TrmPackage, checkPackageDependencies, checkSapEntries } from "trm-core";
import { CheckArguments } from "./arguments";
import { CommandContext } from "./commons";
import { Inquirer, Logger } from "trm-commons";

var systemPackages: TrmPackage[] = [];

const _dependencies = async (oPackage: TrmPackage) => {
    Logger.loading(`Analyzing package dependencies...`);
    const packages = await CommandContext.getSystemPackages();
    await checkPackageDependencies({
        contextData: {
            systemPackages: packages
        },
        packageData: {
            package: oPackage
        },
        printOptions: {
            dependencyStatus: true,
            information: true
        }
    });
}

const _sapEntries = async (oPackage: TrmPackage) => {
    Logger.loading(`Analyzing package SAP Entries...`);
    await checkSapEntries({
        packageData: {
            package: oPackage
        },
        printOptions: {
            entriesStatus: true,
            information: true
        }
    });
}

export async function check(commandArgs: CheckArguments) {
    const packageName = commandArgs.package;
    const analysisTypes = [{
        name: `Dependencies only`,
        value: `DEPENDENCIES`
    }, {
        name: `SAP Entries only`,
        value: `SAPENTRIES`
    }, {
        name: `All`,
        value: `ALL`
    }];
    var analysisType = commandArgs.analysisType;
    if (!analysisType || !analysisTypes.map(o => o.value).includes(analysisType)) {
        const inq1 = await Inquirer.prompt({
            message: `Analysis type`,
            name: `analysisType`,
            type: `list`,
            choices: analysisTypes
        });
        analysisType = inq1.analysisType;
    }
    Logger.loading(`Searching package "${packageName}"...`);
    systemPackages = await CommandContext.getSystemPackages();
    const oPackage = systemPackages.find(o => o.compareName(packageName) && o.compareRegistry(CommandContext.getRegistry()));
    if (!oPackage) {
        throw new Error(`Package "${packageName}" not found.`);
    }
    switch (analysisType) {
        case `DEPENDENCIES`:
            await _dependencies(oPackage);
            break;
        case `SAPENTRIES`:
            await _sapEntries(oPackage);
            break;
        default:
            await _dependencies(oPackage);
            await _sapEntries(oPackage);
            break;
    }
}