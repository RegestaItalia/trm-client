import { ISystemConnector, SystemConnectorSupportedBulk, TADIR, TR_AS4USER, Transport, TRKORR, TrmPackage } from "trm-core";

export class DummyConnector implements ISystemConnector {
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
    closeConnection = async () => this._throw();
    checkConnection = async () => true;
    ping = async () => 'PONG';
    getFileSystem = async () => this._throw();
    getDirTrans = async () => this._throw();
    getBinaryFile = async () => this._throw();
    writeBinaryFile = async () => this._throw();
    createTocTransport = async () => this._throw();
    createWbTransport = async () => this._throw();
    setTransportDoc = async () => this._throw();
    addToTransportRequest = async () => this._throw();
    repositoryEnvironment = async () => this._throw();
    deleteTrkorr = async () => this._throw();
    releaseTrkorr = async () => this._throw();
    addSkipTrkorr = async () => this._throw();
    addSrcTrkorr = async () => this._throw();
    readTmsQueue = async () => this._throw();
    createPackage = async () => this._throw();
    getDefaultTransportLayer = async () => 'NONE';
    tadirInterface = async () => this._throw();
    dequeueTransport = async () => this._throw();
    forwardTransport = async () => this._throw();
    importTransport = async () => this._throw();
    setInstallDevc = async () => this._throw();
    getObjectsList = async () => this._throw();
    renameTransportRequest = async () => this._throw();
    setPackageIntegrity = async () => this._throw();
    addTranslationToTr = async () => this._throw();
    trCopy = async () => this._throw();
    getTransportObjectsBulk?: () => Promise<TADIR[]> = async () => this._throw();
    getExistingObjectsBulk?: () => Promise<TADIR[]> = async () => this._throw();
    addNamespace = async () => this._throw();
    getMessage = async () => this._throw();
    getTransportStatus = async () => this._throw();
    getPackageWorkbenchTransport = async () => this._throw();
    getSourceTrkorr = async () => this._throw();
    getIgnoredTrkorr = async () => this._throw();
    getObject = async () => this._throw();
    getInstalledPackages = async () => {
        return [];
    };
    getDevclass = async () => this._throw();
    getTransportTargets = async () => this._throw();
    getSubpackages = async () => this._throw();
    getDevclassObjects = async () => this._throw();
    getInstallPackages = async () => this._throw();
    setPackageSuperpackage = async () => this._throw();
    clearPackageSuperpackage = async () => this._throw();
    setPackageTransportLayer = async () => this._throw();
    checkSapEntryExists = async () => this._throw();
    getPackageIntegrity = async () => this._throw();
    getFunctionModule = async () => this._throw();
    getExistingObjects = async () => this._throw();
    getNamespace = async () => this._throw();
    getR3transVersion = async () => this._throw();
    getR3transUnicode = async () => this._throw();
    isTransportLayerExist = async () => this._throw();
    getTrmServerPackage = async () => this._throw();
    getTrmRestPackage = async () => this._throw();
    removeComments = async () => this._throw();
    removeSkipTrkorr = async () => this._throw();
    migrateTransport = async () => this._throw();
    deleteTmsTransport = async () => this._throw();
    refreshTransportTmsTxt = async () => this._throw();
    getDotAbapgit = async () => this._throw();
    getAbapgitSource = async () => this._throw();
    executePostActivity = async () => this._throw();
    readClassDescriptions = async () => this._throw();
    isServerApisAllowed = async () => this._throw();
    changeTrOwner = async () => this._throw();
    getWbTransports = async () => this._throw();
}