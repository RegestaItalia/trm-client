import { Logger } from "trm-commons";
import { SystemConnector } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";

export class Ping extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "ping",
        command: "ping",
        title: "Ping server",
        group: "registry",
        guiRelevant: false,
        description: "Ping the TRM server used by the connected system.",
        icon: "Radar",
        arguments: [],
        options: [],
        requirements: {
            requiresConnection: true,
            requiresTrmDependencies: true
        }
    };
    protected async handler(): Promise<void> {
        Logger.loading(`Pinging trm-server on ${SystemConnector.getDest()}...`);
        const pingValue = await SystemConnector.ping();
        Logger.info(pingValue);
    }

}
