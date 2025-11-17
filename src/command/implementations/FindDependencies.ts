import { Logger } from "trm-commons";
import { findDependencies } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";

export class FindDependencies extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.command.description(`Find SAP package dependencies with custom packages/trm packages/SAP entries/objects.`);
        this.command.argument(`<sap package>`, `Name of the SAP package to check.`);
        this.command.option(`--sap-entries`, `Show list of required SAP entries/objects.`, false);
        this.command.option(`--no-prompts`, `No prompts (will force some decisions).`);
    }

    protected async handler(): Promise<void> {
        Logger.loading(`Searching for dependencies in package "${this.args.sapPackage}"...`);
        await findDependencies({
            contextData: {
                noInquirer: !this.args.prompts
            },
            packageData: {
                package: this.args.sapPackage
            },
            printOptions: {
                trmDependencies: true,
                sapObjectDependencies: this.args.sapEntries
            }
        });
    }

}