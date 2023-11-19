import { TrmManifest, checkSapEntries } from "trm-core";
import { ActionArguments, CheckArguments } from "./arguments";

export async function check(commandArgs: CheckArguments, actionArgs: ActionArguments) {
    const logger = actionArgs.logger;
    const system = actionArgs.system;
    const registry = actionArgs.registry;
    const extended = commandArgs.extended;

    const packageName = commandArgs.package;

    logger.loading(`Reading system data...`);
    const aSystemPackages = await system.getInstalledPackages(false);
    const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(registry));
    var oSystemViewManifest: TrmManifest;
    try {
        oSystemViewManifest = oSystemView.manifest.get(true);
    } catch (e) {
        throw new Error(`Package not found.`);
    }

    logger.loading(`Checking SAP entries...`);
    const sapEntriesCheckResult = await checkSapEntries(oSystemViewManifest.sapEntries || {}, system);
    if (extended) {
        /*logger.error(`Missing SAP table entries.`);
        logger.error(`Please check the list below and, if necessary, check notes.`);
        sapEntriesCheckResult.missingSapEntries.forEach(o => {
            var tableHead = [];
            var tableData = [];
            o.entries.forEach(entry => {
                var tableRow = [];
                Object.keys(entry).forEach(field => {
                    if (!tableHead.includes(field)) {
                        tableHead.push(field);
                    }
                    const columnIndex = tableHead.findIndex(f => f === field);
                    tableRow[columnIndex] = entry[field];
                });
                for (var i = 0; i < tableRow.length; i++) {
                    if (!tableRow[i]) {
                        tableRow[i] = '';
                    }
                }
                tableData.push(tableRow);
            });
            logger.error(` `);
            logger.error(`Table ${o.table}:`);
            logger.table(tableHead, tableData);
        });*/
    } else {
        if (sapEntriesCheckResult.missingSapEntries.length === 0) {
            logger.success(`SAP entries check OK.`);
        } else {
            logger.error(`Missing ${sapEntriesCheckResult.missingSapEntries.length} SAP entries.`);
        }
    }
}