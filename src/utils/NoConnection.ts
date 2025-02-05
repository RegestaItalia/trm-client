import { AS4TEXT, DEVCLASS, DEVLAYER, E071, ISystemConnector, LXE_TT_PACKG_LINE, NAMESPACE, PGMID, Registry, RS38L_FNAME, SapMessage, SCOMPKDTLN, SEU_OBJ, SOBJ_NAME, SystemConnectorSupportedBulk, TADIR, TLINE, TMSSYSNAM, TR_TARGET, TRKORR, TrmPackage, TRNLICENSE, TRNSPACETT, TROBJTYPE, ZTRM_INSTALLDEVC, ZTRM_INTEGRITY } from "trm-core";

export class NoConnection implements ISystemConnector {
    _throw() {
        throw new Error(`No connection to SAP server.`);
        return null;
    }

    supportedBulk: SystemConnectorSupportedBulk = {
        getExistingObjects: false,
        getTransportObjects: false
    };

    getConnectionData = () => this._throw();
    getDest = () => 'NONE';
    getLogonLanguage = (c: boolean) => {
        if(c){
            return 'X';
        }else{
            return 'XX';
        }
    };
    getLogonUser = () => 'NONE';
    connect = async () => {
        return;
    };
    checkConnection = async () => true;
    ping = async () => 'PONG';
    getFileSystem = async () => this._throw();
    getDirTrans = async () => this._throw();
    getBinaryFile = async (filePath: string) => this._throw();
    writeBinaryFile = async (filePath: string, binary: Buffer) => this._throw();
    createTocTransport = async (text: AS4TEXT, target: TR_TARGET) => this._throw();
    createWbTransport = async (text: AS4TEXT, target?: TR_TARGET) => this._throw();
    setTransportDoc = async (trkorr: TRKORR, doc: TLINE[]) => this._throw();
    addToTransportRequest = async (trkorr: TRKORR, content: E071[], lock: boolean) => this._throw();
    repositoryEnvironment = async (objectType: SEU_OBJ, objectName: SOBJ_NAME) => this._throw();
    deleteTrkorr = async (trkorr: TRKORR) => this._throw();
    releaseTrkorr = async (trkorr: TRKORR, lock: boolean, timeout?: number) => this._throw();
    addSkipTrkorr = async (trkorr: TRKORR) => this._throw();
    addSrcTrkorr = async (trkorr: TRKORR) => this._throw();
    readTmsQueue = async (target: TMSSYSNAM) => this._throw();
    createPackage = async (scompkdtln: SCOMPKDTLN) => this._throw();
    getDefaultTransportLayer = async () => 'NONE';
    tadirInterface = async (tadir: TADIR) => this._throw();
    dequeueTransport = async (trkorr: TRKORR) => this._throw();
    forwardTransport = async (trkorr: TRKORR, target: TMSSYSNAM, source: TMSSYSNAM, importAgain: boolean) => this._throw();
    importTransport = async (trkorr: TRKORR, system: TMSSYSNAM) => this._throw();
    setInstallDevc = async (installDevc: ZTRM_INSTALLDEVC[]) => this._throw();
    getObjectsList = async () => this._throw();
    renameTransportRequest = async (trkorr: TRKORR, as4text: AS4TEXT) => this._throw();
    setPackageIntegrity = async (integrity: ZTRM_INTEGRITY) => this._throw();
    addTranslationToTr = async (trkorr: TRKORR, devclassFilter: LXE_TT_PACKG_LINE[]) => this._throw();
    trCopy = async (from: TRKORR, to: TRKORR, doc: boolean) => this._throw();
    getTransportObjectsBulk?: (trkorr: TRKORR) => Promise<TADIR[]> = async () => this._throw();
    getExistingObjectsBulk?: (objects: TADIR[]) => Promise<TADIR[]> = async () => this._throw();
    addNamespace = async (namespace: NAMESPACE, replicense: TRNLICENSE, texts: TRNSPACETT[]) => this._throw();
    getMessage = async (data: SapMessage) => this._throw();
    getTransportStatus = async (trkorr: TRKORR) => this._throw();
    getPackageWorkbenchTransport = async (oPackage: TrmPackage) => this._throw();
    getSourceTrkorr = async () => this._throw();
    getIgnoredTrkorr = async () => this._throw();
    getObject = async (pgmid: PGMID, object: TROBJTYPE, objName: SOBJ_NAME) => this._throw();
    getInstalledPackages = async (includeSources: boolean, refresh?: boolean) => {
        return [];
    };
    getDevclass = async (devclass: DEVCLASS) => this._throw();
    getTransportTargets = async () => this._throw();
    getSubpackages = async (devclass: DEVCLASS) => this._throw();
    getDevclassObjects = async (devclass: DEVCLASS, includeSubpackages: boolean) => this._throw();
    getInstallPackages = async (packageName: string, registry: Registry) => this._throw();
    setPackageSuperpackage = async (devclass: DEVCLASS, superpackage: DEVCLASS) => this._throw();
    clearPackageSuperpackage = async (devclass: DEVCLASS) => this._throw();
    setPackageTransportLayer = async (devclass: DEVCLASS, devlayer: DEVLAYER) => this._throw();
    checkSapEntryExists = async (table: string, sapEntry: any) => this._throw();
    getPackageIntegrity = async (oPackage: TrmPackage) => this._throw();
    getFunctionModule = async (func: RS38L_FNAME) => this._throw();
    getExistingObjects = async (objects: TADIR[]) => this._throw();
    getNamespace = async (namespace: NAMESPACE) => this._throw();
    getR3transVersion = async () => this._throw();
    getR3transUnicode = async () => this._throw();
    isTransportLayerExist = async (devlayer: DEVLAYER) => this._throw();
    getTrmServerPackage = async () => this._throw();
    getTrmRestPackage = async () => this._throw();
}