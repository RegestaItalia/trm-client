import { Logger, SystemConnector } from "trm-core";

export async function logError(e: Error) {
    var sError = e.toString();
    if (e.name === 'AxiosError') {
        const apiResponse = e['response'];
        sError = `${apiResponse.status} ${apiResponse.statusText}`;
        if (apiResponse.status === 401) {
            sError += `\nYou may need to log in.`;
        }
    }
    if (e.name === 'ABAPError') {
        if(e['key'] === 'TRM_RFC_UNAUTHORIZED'){
            sError = `You are not authorized to access TRM RFC Functions.`;
            if(SystemConnector.systemConnector){
                sError += ` Ask BASIS to enable user "${SystemConnector.getLogonUser()}".`;
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