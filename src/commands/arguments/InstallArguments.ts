export type InstallArguments = {
    package: string,
    version: string,
    force: boolean,
    ci: boolean,
    importTimeout: string,
    ignoreSapEntries: boolean,
    skipDependencies: boolean,
    keepOriginalPackages: boolean,
    packageReplacements?: string,
    skipWorkbenchTransport: boolean,
    targetSystem?: string,
    transportLayer?: string
}