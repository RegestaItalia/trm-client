export type PublishArguments = {
    package: string,
    version?: string,
    devclass?: string,
    target?: string,
    manifest?: string,
    readme?: string,
    forceManifest: boolean,
    skipLang: boolean,
    skipCustomizing: boolean,
    customizingTransports?: string,
    skipDependencies: boolean,
    skipEditSapEntries: boolean,
    skipEditDependencies: boolean,
    skipReadme: boolean,
    silent: boolean,
    releaseTimeout: string
}