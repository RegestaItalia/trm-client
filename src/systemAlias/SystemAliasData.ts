import { Login, RESTConnection, RFCConnection } from "trm-core";
import { SystemConnectorType } from "../utils";

export type SystemAliasData = {
    alias: string,
    type: SystemConnectorType,
    connection: RESTConnection | RFCConnection,
    login: Login
}