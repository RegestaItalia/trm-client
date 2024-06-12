export type InstallArguments = {
    package: string,
    version: string,
    force: boolean,
    keepOriginals: boolean,
    importTimeout: string,
    workbenchGen: boolean,
    skipSapEntries: boolean,
    skipObjectsCheck: boolean,
    skipLang: boolean,
    skipCustomizing: boolean,
    skipDependencies: boolean,
    silent: boolean,
    replaceAllowed: boolean,
    transportLayer?: string,
    workbenchTarget?: string,
    packageReplacements?: string
}