export type ImportArguments = {
    file: string,
    
    noPrompts: boolean,
    overwrite: boolean,
    safe: boolean,
    noDependencies: boolean,
    noObjectTypes: boolean,
    noSapEntries: boolean,
    noLanguageTransport: boolean,
    noCustomizingTransport: boolean,
    lockfile?: string,
    importTimeout: string,
    keepOriginalPackages: boolean,
    createInstallTransport: boolean,

    r3transPath?: string,
    integrity?: string,
    transportLayer?: string,
    packageReplacements?: string,
    installTransportTargetSys?: string
}