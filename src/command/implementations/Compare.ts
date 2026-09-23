import { Inquirer, Logger } from "trm-commons";
import { ISystemConnector, SystemConnector } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { SystemAlias } from "../../systemAlias";
import { Package } from "trm-registry-types";
import { connect } from "../prompts";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class Compare extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "compare",
        command: "compare",
        title: "Compare package",
        group: "package",
        guiRelevant: false,
        description: "Compare a package across multiple systems.",
        icon: "GitCompare",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name." })
        ],
        options: [
            option("-c, --connections <json>", { name: "connections", label: "Connections", description: "System connection aliases as JSON, or a path to a JSON file.", control: "textarea" })
        ],
        requirements: {
            requiresRegistry: true,
            ignoreRegistryUnreachable: true
        }
    };

    private connections: { connector: ISystemConnector, alias?: SystemAlias }[] = [];
    private async promptConnections(): Promise<boolean> {
        if (this.connections.length > 0) {
            Logger.info(`Compare systems: ${this.connections.map(o => o.connector.getDest()).join(', ')}`);
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
            const systemConnector = connectArgs.connect.getSystemConnector() as ISystemConnector;
            // connection check, systems are then read one at a time
            await systemConnector.connect(false);
            await systemConnector.closeConnection();
            this.connections.push({ connector: systemConnector });
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
                    this.connections.push({ connector: oAlias.getConnection(), alias: oAlias });
                }
            }
        } else {
            var keepPrompt = true;
            while (keepPrompt) {
                keepPrompt = await this.promptConnections();
            }
        }

        Logger.info(`Compare systems: ${this.connections.map(o => o.connector.getDest()).join(', ')}`);

        const tableHead = [`System`, `Installed`, `Version`, `Devclass`, `Import transport`];
        var tableData = [];

        Logger.loading(`Reading registry data...`);
        var oRegistryView: Package;
        try {
            oRegistryView = await this.viewRegistryPackage(packageName, true);
        } catch (e) { }

        Logger.loading(`Reading system data...`);

        for (const { connector: oConnection, alias: oAlias } of this.connections) {
            // one system at a time: some connections (e.g. tunnels) can't be open at the same time
            await oConnection.connect(false);
            if (oAlias) {
                try {
                    oAlias.saveChanges();
                } catch (e) {
                    Logger.error(e, true);
                }
            }
            SystemConnector.systemConnector = oConnection;
            const system = SystemConnector.getDest() || '';
            var installed;
            var version;
            var devclass;
            var importTransport;
            var aSystemPackages;
            try {
                aSystemPackages = await SystemConnector.getInstalledPackages(true);
            } finally {
                await oConnection.closeConnection();
                SystemConnector.systemConnector = undefined; // already closed
            }
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
