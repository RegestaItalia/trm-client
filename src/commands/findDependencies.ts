import { Logger } from "trm-commons";
import { FindDependenciesArguments } from "./arguments";
import { findDependencies as action } from "trm-core";

export async function findDependencies(commandArgs: FindDependenciesArguments) {
    Logger.loading(`Searching for dependencies in package "${commandArgs.devclass}"...`);
    await action({
        contextData: {
            noInquirer: commandArgs.noPrompts
        },
        packageData: {
            package: commandArgs.devclass
        },
        printOptions: {
            trmDependencies: true,
            sapObjectDependencies: commandArgs.sapEntries
        }
    });
}