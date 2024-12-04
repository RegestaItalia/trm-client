import { ISystemConnector } from "trm-core"
import { SystemConnectorType } from "../../utils"

export type ConnectArguments = {
    type?: SystemConnectorType,
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