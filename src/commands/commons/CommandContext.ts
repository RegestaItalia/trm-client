import { AbstractRegistry, Logger, SystemConnector, TrmPackage } from "trm-core";

export namespace CommandContext {
    var _systemPackages: TrmPackage[] = undefined;
    export var registry: AbstractRegistry = undefined;
    export var trmDependencies: TrmPackage[] = [];
    export var missingTrmDependencies: (TrmPackage | string)[] = [];
    
    export function getRegistry(): AbstractRegistry {
        if(!registry) {
            throw new Error('Registry not initialized.');
        }else{
            return registry;
        }
    }

    export async function getSystemPackages(): Promise<TrmPackage[]> {
        if(!this._systemPackages){
            Logger.loading(`Reading system packages...`);
            this._systemPackages = await SystemConnector.getInstalledPackages(true, true, true);
        }
        return this._systemPackages;
    }

}