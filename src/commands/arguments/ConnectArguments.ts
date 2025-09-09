import { ISystemConnector } from "trm-core"

export type ConnectArguments = {
    type?: string,
    dest?: string,
    ashost?: string,
    sysnr?: string,
    saprouter?: string,
    client?: string,
    user?: string,
    passwd?: string,
    lang?: string,
    noSystemAlias?: boolean,
    force?: boolean,
    endpoint?: string,
    forwardRfcDest?: string,
    connection?: ISystemConnector
}