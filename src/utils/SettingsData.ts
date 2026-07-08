export type SettingsData = {
    loggerType: string,
    logOutputFolder: string,
    cliUpdateCheckCache: number,
    npmGlobalPathCheckCache: number,
    guiRegistryAutoConnect: boolean,
    guiRegistryAutoConnectAlias?: string,
    guiSystemAutoConnect: boolean,
    guiSystemAutoConnectAlias?: string,
    sapLandscape?: string,
    r3transDocker?: boolean,
    r3transDockerName?: string
}