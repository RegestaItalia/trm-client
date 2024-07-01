import { FindDependenciesArguments } from "./arguments";
import { Logger, findDependencies as action } from "trm-core";

export async function findDependencies(commandArgs: FindDependenciesArguments) {
    const devclass = commandArgs.devclass;
    const printSapEntries = commandArgs.sapEntries;
    Logger.loading(`Searching for dependencies in package "${devclass}"...`);
    await action({
        devclass,
        print: true,
        printSapEntries
    });
}