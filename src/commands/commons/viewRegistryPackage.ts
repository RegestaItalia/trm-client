import { Logger } from "trm-core";
import { View } from "trm-registry-types";
import { CommandRegistry } from "./CommandRegistry";

export async function viewRegistryPackage(packageName: string, print: boolean = true): Promise<View> {
    Logger.loading(`Reading registry data...`);
    var oRegistryView: View;
    try {
        oRegistryView = await CommandRegistry.get().view(packageName);
    } catch (e) {
        Logger.error(e, true);
        oRegistryView = null;
    }
    if(print){
        if(!oRegistryView){
            Logger.warning(`WARNING: This package was not found on the registry.`);
            Logger.warning(`WARNING: This package may have been deleted!`);
        }else{
            if(oRegistryView.release && oRegistryView.release.deprecated){
                Logger.warning(`WARNING: This package has been marked as deprecated!`); //TODO fix registry doesn't return deprecated note
            }
        }
    }
    return oRegistryView;
}