import { Logger, SystemConnector } from "trm-core";
import { inspect } from "util";

export async function logError(err: any) {
    var e: Error;
    if(err.originalException){
        e = err;
        while((e as any).originalException){
            Logger.error(inspect(e, { breakLength: Infinity, compact: true }), true);
            e = (e as any).originalException;
        }
    }else{
        Logger.error(inspect(err, { breakLength: Infinity, compact: true }), true);
        e = err;
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
            if(e['abapMsgClass'] && e['abapMsgNumber']){
                try {
                    sError = await SystemConnector.getMessage({
                        class: e['abapMsgClass'],
                        no: e['abapMsgNumber'],
                        v1: e['abapMsgV1'],
                        v2: e['abapMsgV2'],
                        v3: e['abapMsgV3'],
                        v4: e['abapMsgV4']
                    });
                } catch (exc) {
                    sError = `${e['key']} - ${e['message']}`;
                }
            }else{
                sError = `${e['key']} - ${e['message']}`;
            }
        }
    }
    if(e.name === 'RfcLibError'){
        sError = e.message;
    }
    Logger.error(sError);
}