import { TrmPackage } from "trm-core";

export class TrmDependencies {
    private static _instance: TrmDependencies = null;
    private _dependencies: TrmPackage[] = [];

    constructor(){}

    public add(trmPackage: TrmPackage): void {
        this._dependencies.push(trmPackage);
    }

    public get(packageName: string): TrmPackage {
        return this._dependencies.find(o => o.compareName(packageName));
    }

    public getAll(): TrmPackage[] {
        return this._dependencies;
    }

    public static getInstance(): TrmDependencies {
        if(!this._instance){
            this._instance = new TrmDependencies();
        }
        return this._instance;
    }
}