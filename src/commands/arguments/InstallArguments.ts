export type InstallArguments = {
    package: string,
    version?: string,
    
    noPrompts: boolean,
    overwrite: boolean,
    safe: boolean,
    noDependencies: boolean,
    noObjectTypes: boolean,
    noSapEntries: boolean,
    noLanguageTransport: boolean,
    noCustomizingTransport: boolean,
    importTimeout: string,
    keepOriginalPackages: boolean,
    createInstallTransport: boolean,

    r3transPath?: string,
    integrity?: string,
    transportLayer?: string,
    packageReplacements?: string,
    installTransportTargetSys?: string
}