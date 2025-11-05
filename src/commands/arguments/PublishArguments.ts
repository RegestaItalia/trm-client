export type PublishArguments = {
    package: string,
    version?: string,
    inc: string,
    tag: string,
    preRelease: boolean,
    preReleaseIdentifier?: string,
    
    noPrompts: boolean,
    private: boolean,
    keepLatestReleaseManifestValues: boolean,
    noLanguageTransport: boolean,
    noDependenciesDetection: boolean,
    skipCustomizingTransports: boolean,
    releaseTimeout: string,

    devclass?: string,
    customizingTransports?: string,
    readme?: string
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