import { Logger, Registry } from "trm-core";
import { View } from "trm-registry-types";

export async function viewRegistryPackage(registry: Registry, packageName: string, logger: Logger) {
    logger.loading(`Reading registry data...`);
    var oRegistryView: View;
    try {
        oRegistryView = await registry.view(packageName);
    } catch (e) {
        oRegistryView = null;
    }
    if(!oRegistryView){
        logger.warning(`WARNING: This package was not found on the registry.`);
        logger.warning(`WARNING: This package may have been deleted!`);
    }else{
        if(oRegistryView.release && oRegistryView.release.deprecated){
            logger.warning(`WARNING: This package has been marked as deprecated!`); //TODO fix registry doesn't return deprecated note
        }
    }
    return oRegistryView;
}