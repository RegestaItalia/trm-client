import { TrmPackage } from "trm-core";

export class TrmDependencies {
    private static _instance: TrmDependencies = undefined;
    private _dependencies: TrmPackage[] = [];
    private _systemPackages: TrmPackage[] = undefined;

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

    public setSystemPackages(systemPackages: TrmPackage[]): void {
        this._systemPackages = systemPackages;
    }

    public getSystemPackages(): TrmPackage[] | undefined {
        return this._systemPackages;
    }

    public static getInstance(): TrmDependencies {
        if(!this._instance){
            this._instance = new TrmDependencies();
        }
        return this._instance;
    }
}