import { Registry, SystemConnector } from "trm-core";
import { satisfies } from "semver";
import { getClientPackage } from "./getClientPackage";
import { TrmDependencies } from "./TrmDependencies";

export async function checkTrmDependencies(system: SystemConnector) {
    const trmClientPackage = getClientPackage();
    const trmDependencies = trmClientPackage.trmDependencies;
    if(trmDependencies && Object.keys(trmDependencies).length > 0){
        const oPublicRegistry = new Registry('public');
        const aSystemPackages = await system.getInstalledPackages(true);
        Object.keys(trmDependencies).forEach(packageName => {
            const versionRange = trmDependencies[packageName];
            const installedPackage = aSystemPackages.find(o => o.packageName === packageName && o.compareRegistry(oPublicRegistry));
            if(!installedPackage || !installedPackage.manifest){
                throw new Error(`Package "${packageName}" is not installed on ${system.getDest()}.`);
            }else{
                const installedVersion = installedPackage.manifest.get().version;
                if(!satisfies(installedVersion, versionRange)){
                    throw new Error(`Package "${packageName}", version ${installedVersion} installed on ${system.getDest()}, but does not satisfy dependency version ${versionRange}.`);
                }else{
                    //singleton add
                    TrmDependencies.getInstance().add(installedPackage);
                }
            }
        });
    }
}