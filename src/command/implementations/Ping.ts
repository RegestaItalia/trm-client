import { Logger } from "trm-commons";
import { SystemConnector } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";

export class Ping extends AbstractCommand {
    
    protected init(): void {
        this.registerOpts.requiresConnection = true;
        this.registerOpts.requiresTrmDependencies = true;
        this.command.description(`Ping trm-server (Used for testing purposes).`);
    }

    protected async handler(): Promise<void> {
        Logger.loading(`Pinging trm-server on ${SystemConnector.getDest()}...`);
        const pingValue = await SystemConnector.ping();
        Logger.info(pingValue);
    }

}