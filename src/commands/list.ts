import { RegistryType, TrmManifest } from "trm-core";
import { ActionArguments, ListArguments } from "./arguments";

export async function list(commandArgs: ListArguments, actionArgs: ActionArguments) {
    const system = actionArgs.system;
    const logger = actionArgs.logger;

    logger.loading(`Reading packages...`);
    const aPackages = await system.getInstalledPackages(true);
    if (aPackages.length > 0) {
        const tableHead = [`Package name`, `Version`, `Registry`, `Devclass`, `Transport request`];
        var tableData = [];

        var connectionData = [];
        var tkrorr: string;
        var devclass: string;
        var manifest: TrmManifest;
        for (const oPackage of aPackages) {
            connectionData = [];
            tkrorr = null;
            devclass = null;
            manifest = null;
            const oManifest = oPackage.manifest;
            if (oManifest) {
                manifest = oManifest.get(true);
                const linkedTransport = oManifest.getLinkedTransport();
                if (linkedTransport) {
                    tkrorr = linkedTransport.trkorr;
                    try {
                        devclass = await linkedTransport.getDevclass();
                    } catch (e) { }
                }
            }
            connectionData.push(oPackage.packageName);
            connectionData.push(manifest ? manifest.version : '');
            connectionData.push(oPackage.registry.getRegistryType() === RegistryType.PUBLIC ? 'public' : oPackage.registry.endpoint);
            connectionData.push(devclass || '');
            connectionData.push(tkrorr || '');
            tableData.push(connectionData);
        }

        logger.info(`${system.getDest()} has ${aPackages.length} packages.`);
        logger.log(` `);
        logger.table(tableHead, tableData);
    } else {
        logger.info(`No packages found.`);
    }
}