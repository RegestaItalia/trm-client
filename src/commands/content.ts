import { Logger, SystemConnector, TreeLog, TrmArtifact, TrmPackage, TrmTransportIdentifier } from "trm-core";
import { ContentArguments } from "./arguments";
import { CommandContext } from "./commons";
import { getTempFolder } from "../utils";
import chalk from "chalk";

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
        r3transDirPath: commandArgs.r3transPath
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
                            text: chalk.bgBlueBright(sRecord.join(', ')),
                            children: []
                        });
                    } else if (record.__isCust) {
                        tableNode.children.push({
                            text: chalk.bgCyanBright(sRecord.join(', ')),
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
    if (remoteManifest.get().namespace) {
        Logger.info(`ABAP package namespace repair license: ${chalk.bold(remoteManifest.get().namespace.replicense)}`);
    }
    Object.keys(packageContent).forEach(transportIdentifier => {
        switch (transportIdentifier) {
            case 'DEVC':
                Logger.info(chalk.bgGrey(`ABAP package transport: ${packageContent[transportIdentifier].trkorr}, ${chalk.bgGrey('package records are highlited')}`));
                break;
            case 'TADIR':
                Logger.info(`TRM transport: ${packageContent[transportIdentifier].trkorr}`);
                break;
            case 'CUST':
                Logger.info(`Has customizing transport? Yes (${packageContent[transportIdentifier].trkorr}), ${chalk.bgCyanBright('customizing records are highlited')}`);
                break;
            case 'LANG':
                Logger.info(`Has translation transport? Yes (${packageContent[transportIdentifier].trkorr}), ${chalk.bgBlueBright('translation records are highlited')}`);
                break;
        }
    });
    if (iOtherEntries > 0) {
        Logger.warning(`There are ${iOtherEntries} other records to show. Run with option --all in order to see them.`);
    }
}