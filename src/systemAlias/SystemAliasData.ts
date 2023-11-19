import { Connection, Login } from "trm-core";

export type SystemAliasData = {
    alias: string,
    connection: Connection,
    login: Login
}