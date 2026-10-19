import { Logger } from "trm-commons";
import { uninstall } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class Uninstall extends AbstractCommand {
    public static readonly metadata: CommandMetadata = {
        id: "uninstall",
        command: "uninstall",
        title: "Uninstall package",
        group: "package",
        description: "Uninstall a package and nested packages from the connected system.",
        icon: "PackageMinus",
        arguments: [argument(0, { name: "package", label: "Package", description: "Installed package name." })],
        options: [
            option("--no-dependants", { name: "dependants", label: "Check dependants", description: "Skip checking installed packages that depend on this package.", control: "checkbox", defaultValue: true, negated: true }),
            option("--ignore-dirty", { name: "ignoreDirty", label: "Ignore dirty changes", description: "Uninstall despite local changes without confirmation.", control: "checkbox" }),
            option("--landscape-tr-target <target>", { name: "landscapeTrTarget", label: "Landscape transport target", description: "TMS target of the landscape transport carrying the deletion.", control: "transport-target-picker" }),
            option("--ignore-import-errors", { name: "ignoreImportErrors", label: "Ignore import errors", description: "Log imports ending with return code 8 or higher as errors instead of failing.", control: "checkbox" }),
            option("--no-prompts", { name: "prompts", label: "Prompts", description: "Disable interactive prompts.", control: "checkbox", defaultValue: true, guiRelevant: false, negated: true })
        ],
        requirements: {
            requiresConnection: true,
            requiresTrmDependencies: true,
            requiresRegistry: true
        }
    };

    protected async handler(): Promise<void> {
        const result = await uninstall({
            contextData: {
                systemPackages: await this.getSystemPackages(),
                noInquirer: !this.args.prompts
            },
            packageData: { name: this.args.package, registry: this.getRegistry() },
            uninstallData: {
                checks: { noDependants: !this.args.dependants, ignoreDirty: this.args.ignoreDirty },
                landscapeTransport: { targetSystem: this.args.landscapeTrTarget },
                ignoreImportErrors: this.args.ignoreImportErrors
            }
        });
        Logger.success(`${result.manifest.name} v${result.manifest.version} uninstalled`);
        if (result.landscapeTransport) {
            Logger.info(`Landscape transport ${result.landscapeTransport.trkorr} carries the deletion to ${result.targetSystem || 'the target system'}.`);
        }
    }
}
