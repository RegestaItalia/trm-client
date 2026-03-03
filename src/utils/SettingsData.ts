export type SettingsData = {
    loggerType: string,
    logOutputFolder: string,
    cliUpdateCheckCache: number,
    npmGlobalPathCheckCache: number,
    sapLandscape?: string,
    r3transDocker?: boolean,
    r3transDockerName?: string
}