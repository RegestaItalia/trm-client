import { Logger } from "trm-commons";
import { AbstractCommand } from "../AbstractCommand";
import { logPackageDependencies, SystemConnector } from "trm-core";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class FindDependencies extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "find-dependencies",
        command: "find-dependencies",
        title: "Find dependencies",
        group: "utility",
        groupPriority: 9,
        description: "Find TRM, customer package, and SAP object dependencies for an SAP package.",
        icon: "Search",
        arguments: [
            argument(0, { name: "sapPackage", cliName: "sap package", label: "SAP package", description: "SAP package to inspect.", control: "sap-package-picker" })
        ],
        options: [
            option("--sap-entries", { name: "sapEntries", label: "SAP entries", description: "Include required SAP table entries and objects.", control: "checkbox", defaultValue: false, guiDefaultValue: true }),
            option("--no-prompts", { name: "prompts", label: "Prompts", description: "Disable prompts and use automatic decisions.", control: "checkbox", defaultValue: true, guiRelevant: false, negated: true }),
            option("--trm-found-in", { name: "trmFoundIn", label: "Dependency references", description: "Show which objects reference each TRM dependency.", control: "checkbox", defaultValue: false, guiDefaultValue: true })
        ],
        requirements: {
            requiresConnection: true
        }
    };
    protected async handler(): Promise<void> {
        const dependencies = await SystemConnector.getPackageDependencies(this.args.sapPackage.toUpperCase(), true);
        logPackageDependencies(dependencies, {
            sapEntries: this.args.sapEntries,
            trmFoundIn: this.args.trmFoundIn
        });
        if (dependencies.trmPackageDependencies.length > 0 && !this.args.trmFoundIn) {
            Logger.warning(`To expand and see where TRM dependencies were found, execute with option --trm-found-in`);
        }
    }

}
