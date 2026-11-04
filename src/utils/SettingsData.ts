export type SettingsData = {
    loggerType: string,
    logOutputFolder: string,
    cliUpdateCheckCache: number,
    guiRegistryAutoConnect: boolean,
    guiRegistryAutoConnectAlias?: string,
    guiSystemAutoConnect: boolean,
    guiSystemAutoConnectAlias?: string,
    sapLandscape?: string,
    r3transDocker?: boolean,
    r3transDockerName?: string,
    /** Send opt-in, anonymous telemetry to the registry after installs. Defaults to false. */
    telemetry: boolean
}