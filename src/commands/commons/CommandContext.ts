import { Registry, SystemConnector, TrmPackage } from "trm-core";

export namespace CommandContext {
    var _systemPackages: TrmPackage[] = undefined;
    export var registry: Registry = undefined;
    export var trmDependencies: TrmPackage[] = [];
    export var missingTrmDependencies: (TrmPackage | string)[] = [];
    
    export function getRegistry(): Registry {
        if(!registry) {
            throw new Error('Registry not initialized.');
        }else{
            return registry;
        }
    }

    export async function getSystemPackages(): Promise<TrmPackage[]> {
        if(!this._systemPackages){
            this._systemPackages = await SystemConnector.getInstalledPackages(true);
        }
        return this._systemPackages;
    }

}