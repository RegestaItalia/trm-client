import { Logger, Registry, SystemConnector, TrmPackage } from "trm-core";
import { satisfies } from "semver";
import { TrmDependencies } from "./TrmDependencies";
import { getTrmDependencies } from "./getTrmDependencies";

export async function checkTrmDependencies() {
    const trmDependencies = getTrmDependencies();
    if(trmDependencies && Object.keys(trmDependencies).length > 0){
        const oPublicRegistry = new Registry('public');
        Logger.loading(`Reading system data...`);
        var aSystemPackages: TrmPackage[];
        if(!TrmDependencies.getInstance().getSystemPackages()){
            aSystemPackages = await SystemConnector.getInstalledPackages(true);
            TrmDependencies.getInstance().setSystemPackages(aSystemPackages);
        }else{
            aSystemPackages = TrmDependencies.getInstance().getSystemPackages();
        }
        Object.keys(trmDependencies).forEach(packageName => {
            const versionRange = trmDependencies[packageName];
            const installedPackage = aSystemPackages.find(o => o.packageName === packageName && o.compareRegistry(oPublicRegistry));
            if(!installedPackage || !installedPackage.manifest){
                throw new Error(`Package "${packageName}" is not installed on ${SystemConnector.getDest()}.`);
            }else{
                const installedVersion = installedPackage.manifest.get().version;
                if(!satisfies(installedVersion, versionRange)){
                    throw new Error(`Package "${packageName}", version ${installedVersion} installed on ${SystemConnector.getDest()}, but does not satisfy dependency version ${versionRange}.`);
                }else{
                    //singleton add
                    TrmDependencies.getInstance().add(installedPackage);
                }
            }
        });
    }
}