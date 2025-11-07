import { Logger, TreeLog } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { getTempFolder, GlobalContext } from "../../utils";
import chalk from "chalk";

export class Content extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        this.registerOpts.requiresR3trans = true;
        this.command.description(`Extract and list content of a package.`);
        this.command.addHelpText(`before`, `This command has no effect when trying to login into a registry that doesn't require authentication.`);
        this.command.argument(`<package>`, `Name of the package.`);
        this.command.argument(`[version]`, `Version or tag of the package`, 'latest');
        this.command.option(`--full`, `Show all transport entries of the package`, false);
    }

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
        const packageContent = await artifact.getContent({
            tempDirPath: getTempFolder(),
            r3transDirPath: this.args.r3transPath,
            useDocker: GlobalContext.getInstance().getSettings().r3transDocker,
            dockerOptions: {
                name: GlobalContext.getInstance().getSettings().r3transDockerName
            }
        });
        if (this.args.tadirOnly) {
            transports.TADIR = packageContent.TADIR.trkorr;
            aNodes.push({
                tableName: 'TADIR',
                content: packageContent.TADIR.content.TADIR
            });
            Object.keys(packageContent).forEach(type => {
                if (type === 'TADIR') {
                    return;
                }
                Object.keys(packageContent[type].content).forEach(tableName => {
                    iOtherEntries += packageContent[type].content[tableName].length;
                });
            })
        } else {
            Object.keys(packageContent).forEach(type => {
                transports[type] = packageContent[type].trkorr;
                Object.keys(packageContent[type].content).forEach(tableName => {
                    var nodeIndex = aNodes.findIndex(o => o.tableName === tableName);
                    if (nodeIndex < 0) {
                        nodeIndex = (aNodes.push({
                            tableName,
                            content: []
                        })) - 1;
                    }
                    aNodes[nodeIndex].content = aNodes[nodeIndex].content.concat(packageContent[type].content[tableName].map(o => {
                        o.__isDevc = type === 'DEVC';
                        o.__isLang = type === 'LANG';
                        o.__isCust = type === 'CUST';
                        return o;
                    }));
                });
            });
        }
        var tree: TreeLog = {
            text: `${chalk.bold(this.args.package)} v${data.manifest.version} content`,
            children: []
        };
        aNodes.forEach(node => {
            if (node.content.length > 0) {
                var tableNode: TreeLog = {
                    text: `${chalk.bold(node.tableName)} (${node.content.length} record${node.content.length > 1 ? 's' : ''})`,
                    children: []
                };
                node.content.forEach(record => {
                    var sRecord = [];
                    Object.keys(record).filter(k => !k.startsWith('__')).forEach(field => {
                        var fieldValue = record[field];
                        if (field && fieldValue) {
                            if (node.tableName === 'TADIR') {
                                if (field === 'SRCSYSTEM') {
                                    fieldValue = chalk.strikethrough(fieldValue);
                                } else if (field === 'DEVCLASS') {
                                    fieldValue = chalk.italic(fieldValue);
                                }
                            }
                            sRecord.push(`${chalk.bold(field)}: ${fieldValue}`);
                        }
                    });
                    if (sRecord.length > 0) {
                        if (record.__isDevc) {
                            tableNode.children.push({
                                text: chalk.bgGrey(sRecord.join(', ')),
                                children: []
                            });
                        } else if (record.__isLang) {
                            tableNode.children.push({
                                text: chalk.bgGreen(sRecord.join(', ')),
                                children: []
                            });
                        } else if (record.__isCust) {
                            tableNode.children.push({
                                text: chalk.bgYellow(sRecord.join(', ')),
                                children: []
                            });
                        } else {
                            tableNode.children.push({
                                text: sRecord.join(', '),
                                children: []
                            });
                        }
                    }
                });
                tree.children.push(tableNode);
            }
        });
        Logger.tree(tree);

        var header = ['', 'Namespace', 'ABAP Package', 'TRM Transport', 'Customizing', 'Translations'];
        var row1 = [''];
        var row2 = ['Highlight color'];
        if (data.manifest.namespace) {
            row1.push(`${data.manifest.namespace.ns || 'Yes'} ${data.manifest.namespace.replicense}`);
            row2.push(``);
        } else {
            row1.push(`No`);
            row2.push(``);
        }
        if (Object.keys(packageContent).includes('DEVC')) {
            row1.push(packageContent['DEVC'].trkorr);
            row2.push(`${chalk.bgGrey('Grey')}`);
        } else {
            row1.push(`No`);
            row2.push(``);
        }
        if (Object.keys(packageContent).includes('TADIR')) {
            row1.push(packageContent['TADIR'].trkorr);
            row2.push(``);
        } else {
            row1.push(`No`);
            row2.push(``);
        }
        if (Object.keys(packageContent).includes('CUST')) {
            row1.push(packageContent['CUST'].trkorr);
            row2.push(`${chalk.bgYellow('Yellow')}`);
        } else {
            row1.push(`No`);
            row2.push(``);
        }
        if (Object.keys(packageContent).includes('LANG')) {
            row1.push(packageContent['LANG'].trkorr);
            row2.push(`${chalk.bgGreen('Green')}`);
        } else {
            row1.push(`No`);
            row2.push(``);
        }
        if (row2.filter(s => s.length > 0).length > 0) {
            Logger.table(header, [row1, row2]);
        } else {
            Logger.table(header, [row1]);
        }

        if (iOtherEntries > 0) {
            Logger.warning(`There are ${iOtherEntries} other entries to show. Run with option "--full" in order to see them.`);
        }
    }

}