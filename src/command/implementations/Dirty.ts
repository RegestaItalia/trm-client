import { Logger } from "trm-commons";
import { Transport, ZTRM_DIRTY } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import chalk from "chalk";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class Dirty extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "dirty",
        command: "dirty",
        title: "Show dirty entries",
        group: "package",
        guiRelevant: false,
        description: "Show objects that caused a package to be marked as dirty.",
        icon: "TriangleAlert",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package to inspect." })
        ],
        options: [
            option("--latest-only", { name: "latestOnly", label: "Latest only", description: "Show only the latest transports that contain changes.", control: "checkbox", defaultValue: false })
        ],
        requirements: {
            requiresConnection: true,
            requiresRegistry: true,
            ignoreRegistryUnreachable: true
        }
    };
    private keepFirstByKey(entries: ZTRM_DIRTY[]): ZTRM_DIRTY[] {
        const seen = new Set<string>();

        return entries.filter(entry => {
            const key = `${entry.pgmid}|${entry.object}|${entry.objName}`;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }

    protected async handler(): Promise<void> {
        const packages = await this.getSystemPackages();
        const dirtyPackage = packages.find(o => o.compareName(this.args.package) && o.compareRegistry(this.getRegistry()));
        if (!dirtyPackage) {
            throw new Error(`Package "${this.args.package}" not found`);
        }
        if (!dirtyPackage.isDirty()) {
            throw new Error(`Package "${this.args.package}" is not flagged as dirty!`);
        }
        Logger.warning(`Package "${this.args.package}" is flagged as dirty!`);
        Logger.info(`This means that one (or more) of its objects were added/removed/changed and its TRM manifest is ${chalk.bold('INVALID')}.`);
        Logger.info(`Here's a list of all entries that flagged the package.`);
        var dirtyEntries = dirtyPackage.getDirtyEntries();
        const iDirtyEntries = dirtyEntries.length;
        if (this.args.latestOnly) {
            Logger.info(`Showing only the latest transports.`);
            dirtyEntries = this.keepFirstByKey(dirtyEntries);
        }
        const grouped = Array.from(
            dirtyEntries.reduce((map, item) => {
                if (!map.has(item.trkorr)) {
                    map.set(item.trkorr, {
                        text: `${Transport.getTransportIcon()}  ${item.trkorr}${item.as4Text ? ': ' + item.as4Text : ''}`.trim(),
                        children: [],
                    });
                }

                map.get(item.trkorr)!.children.push({
                    text: `${item.pgmid} ${item.object} ${item.objName}`,
                    children: [],
                });

                return map;
            }, new Map<string, { text: string; children: any[] }>())
                .values()
        );
        Logger.tree({
            text: `${iDirtyEntries} (total) dirty entr${iDirtyEntries > 1 ? 'ies' : 'y'}`,
            children: grouped
        });
    }

}
