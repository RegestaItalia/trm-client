import { Registry, TrmPackage } from "trm-core";

export namespace CommandContext {
    export var registry: Registry = undefined;
    export var systemPackages: TrmPackage[] = undefined;
    export var trmDependencies: TrmPackage[] = [];
    
    export function getRegistry(): Registry {
        if(!registry) {
            throw new Error('Registry not initialized.');
        }else{
            return registry;
        }
    }

}