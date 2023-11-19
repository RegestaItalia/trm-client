export type PublishArguments = {
    package: string,
    devclass?: string,
    version?: string,
    target?: string,
    manifest?: string,
    forceManifest: boolean,
    overwriteManifest: boolean,
    skipDependencies: boolean,
    skipEditSapEntries: boolean,
    skipEditDependencies: boolean,
    skipReadme: boolean,
    readme?: string,
    ci: boolean,
    releaseTimeout: string
}