import { Inquirer, Logger } from "trm-commons";
import { ISystemConnector, SystemConnector } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { SystemAlias } from "../../systemAlias";
import { Package } from "trm-registry-types";
import { connect } from "../prompts";

export class Compare extends AbstractCommand {

    private connections: ISystemConnector[] = [];

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        this.registerOpts.ignoreRegistryUnreachable = true;
        this.command.description(`Compare a package between different systems.`);
        this.command.argument(`<package>`, `Name of the package.`);
        this.command.option(`-c, --connections <json>`, `Array of system connection aliases (JSON or path to JSON file).`);
    }

    private async promptConnections(): Promise<boolean> {
        if (this.connections.length > 0) {
            Logger.info(`Compare systems: ${this.connections.map(o => o.getDest()).join(', ')}`);
        }
        var askConnection = true;
        const inq1 = await Inquirer.prompt([{
            message: "Add another connection?",
            name: "continue",
            type: "confirm",
            default: true,
            when: this.connections.length > 0
        }]);
        askConnection = inq1.continue !== undefined ? inq1.continue : askConnection;
        if (askConnection) {
            const connectArgs = await connect({}, false, false);
            const systemConnector = connectArgs.getSystemConnector() as ISystemConnector;
            await systemConnector.connect();
            this.connections.push(systemConnector);
            return true;
        }else{
            return false;
        }
    }

    protected async handler(): Promise<void> {
        const packageName = this.args.package;
        const registry = this.getRegistry();

        var inputConnections = this.parseJsonArg('connections');
        if (Array.isArray(inputConnections)) {
            for (const sAlias of inputConnections) {
                if (typeof (sAlias) === 'string') {
                    const oAlias = SystemAlias.get(sAlias);
                    const oConnection = oAlias.getConnection();
                    this.connections.push(oConnection);
                }
            }
        } else {
            var keepPrompt = true;
            while (keepPrompt) {
                keepPrompt = await this.promptConnections();
            }
        }

        Logger.info(`Compare systems: ${this.connections.map(o => o.getDest()).join(', ')}`);

        const tableHead = [`System`, `Installed`, `Version`, `Devclass`, `Import transport`];
        var tableData = [];

        Logger.loading(`Reading registry data...`);
        var oRegistryView: Package;
        try {
            oRegistryView = await this.viewRegistryPackage(packageName, true);
        } catch (e) { }

        Logger.loading(`Reading system data...`);

        for (const oConnection of this.connections) {
            SystemConnector.systemConnector = oConnection;
            const system = SystemConnector.getDest() || '';
            var installed;
            var version;
            var devclass;
            var importTransport;
            const aSystemPackages = await SystemConnector.getInstalledPackages(true);
            const oSystemView = aSystemPackages.find(o => o.compareName(packageName) && o.compareRegistry(registry));
            if (oSystemView && oSystemView.manifest) {
                installed = 'Yes';
                version = oSystemView.manifest.get().version || 'Unknown';
                devclass = oSystemView.getDevclass() || 'Unknown';
                if (oSystemView.manifest.getLinkedTransport()) {
                    importTransport = oSystemView.manifest.getLinkedTransport().trkorr;
                } else {
                    importTransport = 'Unknown';
                }
            } else {
                installed = 'No';
                version = '';
                devclass = '';
                importTransport = '';
            }
            tableData.push([
                system,
                installed,
                version,
                devclass,
                importTransport
            ]);
        }

        Logger.info(`Package name: ${packageName}`);
        Logger.info(`Registry: ${registry.name}`);
        try {
            Logger.info(`Latest version: ${oRegistryView.dist_tags['latest'] || 'unknown'}`);
        } catch (e) {
            Logger.warning(`Latest version: Unknown`);
        }
        Logger.log(`\n`);
        Logger.table(tableHead, tableData);
    }

}