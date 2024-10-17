import { ISystemConnector, Login, RESTSystemConnector, RFCSystemConnector } from "trm-core";

export enum SystemConnectorType {
    RFC = 'RFC',
    REST = 'REST'
}

export function getSystemConnector(type: SystemConnectorType, args: {
    connection: any,
    login: Login
}): ISystemConnector {
    const parsingError = new Error(`Unable to parse connection data of type "${type}".`);
    switch(type){
        case SystemConnectorType.RFC:
            try{
                return new RFCSystemConnector(args.connection, args.login);
            }catch(e){
                throw parsingError;
            }
        case SystemConnectorType.REST:
            try{
                return new RESTSystemConnector(args.connection, args.login);
            }catch(e){
                throw parsingError;
            }
        default:
            throw new Error(`Unknown connection type "${type}". Possible values are ${Object.keys(SystemConnectorType).map(k => SystemConnectorType[k]).join(', ')}.`);
    }
}