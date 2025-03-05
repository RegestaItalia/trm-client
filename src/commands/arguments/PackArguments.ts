export type PackArguments = {
    package: string,
    version?: string,
    
    outputPath?: string,

    noPrompts: boolean,
    noLanguageTransport: boolean,
    noDependenciesDetection: boolean,
    skipCustomizingTransports: boolean,
    releaseTimeout: string,

    devclass?: string,
    customizingTransports?: string,
    transportTarget?: string

    //manifest values//
    backwardsCompatible: boolean,
    description?: string,
    git?: string,
    website?: string,
    license?: string,
    authors?: string,
    keywords?: string,
    dependencies?: string,
    sapEntries?: string,
}