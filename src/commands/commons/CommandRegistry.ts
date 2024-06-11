import { Registry } from "trm-core";

export namespace CommandRegistry {
    export var registry: Registry;

    function checkRegistry(){
        if(!registry){
            throw new Error('Registry not initialized.');
        }
    }
    
    export function get(): Registry {
        checkRegistry();
        return registry;
    }
}