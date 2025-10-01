import { TrmPackage } from "trm-core";
import { ContentArguments } from "./arguments";
import { CommandContext } from "./commons";
import { Context, getTempFolder } from "../utils";
import chalk from "chalk";
import { Logger, TreeLog } from "trm-commons";

export async function content(commandArgs: ContentArguments) {
    //search package
    Logger.loading(`Searching package "${commandArgs.package}"...`);
    const remotePackage = new TrmPackage(commandArgs.package, CommandContext.getRegistry());
    const remoteManifest = await remotePackage.fetchRemoteManifest(commandArgs.version);

    Logger.loading(`Reading content...`);
    //build output tree
    var transports: any = {};
    var aNodes: {
        tableName: string,
        content: any[]
    }[] = [];
    var iOtherEntries = 0;
    const packageContent = await remotePackage.fetchRemoteContent(commandArgs.version, {
        tempDirPath: getTempFolder(),
        r3transDirPath: commandArgs.r3transPath,
        useDocker: Context.getInstance().getSettings().r3transDocker,
        dockerOptions: {
            name: Context.getInstance().getSettings().r3transDockerName
        }
    });
    if (!commandArgs.all) {
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
        text: `${chalk.bold(commandArgs.package)} v${remoteManifest.get().version} content`,
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

    var header = ['Namespace', 'ABAP Package', 'TRM Transport', 'Customizing', 'Translations'];
    var row1 = [];
    var row2 = [];
    if (remoteManifest.get().namespace) {
        row1.push(`\u2714`);
        row2.push(remoteManifest.get().namespace.replicense);
    } else {
        row1.push(`\u274C`);
        row2.push(``);
    }
    if (Object.keys(packageContent).includes('DEVC')) {
        row1.push(`\u2714 ${packageContent['DEVC'].trkorr}`);
        row2.push(`${chalk.bgGrey('Highlight')}`);
    } else {
        row1.push(`\u274C`);
        row2.push(``);
    }
    if (Object.keys(packageContent).includes('TADIR')) {
        row1.push(`\u2714 ${packageContent['TADIR'].trkorr}`);
        row2.push(``);
    } else {
        row1.push(`\u274C`);
        row2.push(``);
    }
    if (Object.keys(packageContent).includes('CUST')) {
        row1.push(`\u2714 ${packageContent['CUST'].trkorr}`);
        row2.push(`${chalk.bgYellow('Highlight')}`);
    } else {
        row1.push(`\u274C`);
        row2.push(``);
    }
    if (Object.keys(packageContent).includes('LANG')) {
        row1.push(`\u2714 ${packageContent['LANG'].trkorr}`);
        row2.push(`${chalk.bgGreen('Highlight')}`);
    } else {
        row1.push(`\u274C`);
        row2.push(``);
    }
    if (row2.filter(s => s.length > 0).length > 0) {
        Logger.table(header, [row1, row2]);
    } else {
        Logger.table(header, [row1]);
    }

    if (iOtherEntries > 0) {
        Logger.warning(`There are ${iOtherEntries} other records to show. Run with option --all in order to see them.`);
    }
}