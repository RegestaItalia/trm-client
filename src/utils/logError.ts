import { Logger, SystemConnector } from "trm-core";

export async function logError(e: Error) {
    //temporary solution for workflow exceptions
    if(e['stepName'] && e['originalException']){
        e = e['originalException'];
    }
    var sError = e.toString();
    if (e.name === 'TrmRegistryError') {
        const status = e['status'];
        const message = e.message;
        sError = `${status}: ${message}`;
        if (status === 401) {
            sError += `\nYou may need to log in.`;
        }
    }
    if (e.name === 'ABAPError') {
        if(e['key'] === 'TRM_RFC_UNAUTHORIZED'){
            sError = `You are not authorized to access TRM RFC functions.`;
            if(SystemConnector.systemConnector){
                sError += ` Ask to enable user "${SystemConnector.getLogonUser()}" on ${SystemConnector.getDest()}.`;
            }
        }else{
            try {
                sError = await SystemConnector.getMessage({
                    class: e['abapMsgClass'],
                    no: e['abapMsgNumber'],
                    v1: e['abapMsgV1'],
                    v2: e['abapMsgV2'],
                    v3: e['abapMsgV3'],
                    v4: e['abapMsgV4']
                });
            } catch (e) {
                if(e['key']){
                    sError += ` - ${e['key']}`;
                }
            }
        }
    }
    if(e.name === 'RfcLibError'){
        sError = e.message;
    }
    if (!Logger.logger) {
        console.error(sError);
    }else{
        Logger.error(sError);
    }
}