import { Inquirer, Logger, Registry, SystemConnector } from "trm-core"

export type ActionArguments = {
    inquirer?: Inquirer,
    system?: SystemConnector,
    logger?: Logger,
    registry?: Registry,
    registryForcedLogin?: boolean
}