export type SettingsData = {
    loggerType: string,
    logOutputFolder: string,
    cliUpdateCheckCache: number,
    npmGlobalPathCheckCache: number,
    guiRegistryAutoconnect: boolean,
    guiRegistryAutoconnectAlias?: string,
    guiSystemAutoconnect: boolean,
    guiSystemAutoconnectAlias?: string,
    sapLandscape?: string,
    r3transDocker?: boolean,
    r3transDockerName?: string
}