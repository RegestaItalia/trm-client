import { Logger } from "trm-commons";
import { TreeTableLog } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import chalk from "chalk";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class Content extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "content",
        command: "content",
        aliases: ["contents"],
        title: "Package content",
        group: "registry",
        groupPriority: 7,
        description: "View the contents of a package release in registry.",
        icon: "FolderTree",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name." }),
            argument(1, { name: "version", label: "Version", description: "Package version or distribution tag.", required: false, defaultValue: "latest" })
        ],
        options: [
            option("--full", { name: "full", label: "Full content", description: "Show all transport entries in the package.", control: "checkbox", defaultValue: false, guiDefaultValue: true })
        ],
        requirements: {
            requiresRegistry: true
        }
    };
    protected async handler(): Promise<void> {
        //build output tree
        var transports: any = {};
        var aNodes: {
            tableName: string,
            content: any[]
        }[] = [];
        var iOtherEntries = 0;

        //search package
        const registry = this.getRegistry();
        Logger.loading(`Searching package "${this.args.package}"...`);
        const data = await registry.getPackage(this.args.package, this.args.version);
        const artifact = await registry.downloadArtifact(this.args.package, this.args.version);

        Logger.loading(`Reading content...`);
        const packageTransports = await artifact.getTransportBinaries();
        let otherEntries = 0;
        for (const transport of packageTransports) {
            const type = transport.type || 'TADIR';
            transports[type] = [...(transports[type] || []), transport.trkorr];
            const entries = this.args.full ? transport.entries : { tadir: transport.entries.tadir };
            if (!this.args.full) {
                otherEntries += transport.entries.e071.length + transport.entries.tdevc.length + transport.entries.tdevct.length;
            }
            for (const [tableName, records] of Object.entries(entries)) {
                if (!records.length) continue;
                aNodes.push({
                    tableName: `${tableName.toUpperCase()} (${type} ${transport.trkorr})`,
                    content: records.map(record => ({ ...record }))
                });
            }
        }
        iOtherEntries = otherEntries;
        //text loggers print each node text, the GUI renders a tab per table with the record fields as columns
        var tree: TreeTableLog = {
            text: `${chalk.bold(this.args.package)} v${data.manifest.version} content`,
            layout: 'tabs',
            children: []
        };
        aNodes.forEach(node => {
            if (node.content.length > 0) {
                const isFilled = (value: any) => value !== undefined && value !== null && value !== '';
                const columns = [...new Set(node.content.flatMap(record => Object.keys(record)))]
                    .filter(field => node.content.some(record => isFilled(record[field])));
                var tableNode: TreeTableLog = {
                    text: `${chalk.bold(node.tableName)} (${node.content.length} record${node.content.length > 1 ? 's' : ''})`,
                    columns,
                    children: []
                };
                node.content.forEach(record => {
                    const fields = Object.entries(record)
                        .filter(([_, value]) => isFilled(value))
                        .map(([field, value]) => `${chalk.bold(field)}: ${value}`);
                    tableNode.children.push({
                        text: fields.join(', '),
                        cells: columns.map(field => isFilled(record[field]) ? String(record[field]) : ''),
                        children: []
                    });
                });
                tree.children.push(tableNode);
            }
        });
        Logger.tree(tree);

        Logger.table(['Type', 'Transports'], Object.entries(transports).map(([type, requests]) => [type, (requests as string[]).join(', ')]));

        if (iOtherEntries > 0) {
            Logger.warning(`There are ${iOtherEntries} other entries to show. Run with option "--full" in order to see them.`);
        }
    }

}
