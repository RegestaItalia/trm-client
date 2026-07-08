import { LOCAL_RESERVED_KEYWORD, PUBLIC_RESERVED_KEYWORD } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { Inquirer, Logger } from "trm-commons";
import { RegistryAlias } from "../../registryAlias";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

export class Registry extends AbstractCommand {

    public static readonly metadata: CommandMetadata[] = [
        {
            id: "registry:add",
            command: "registry",
            subcommand: "add",
            title: "Add registry",
            group: "registry",
            guiRelevant: false,
            description: "Add a registry alias.",
            icon: "DatabaseZap",
            arguments: [
                argument(0, { name: "registryName", cliName: "registry name", label: "Registry name", description: `Registry alias to create. "${PUBLIC_RESERVED_KEYWORD}" and "${LOCAL_RESERVED_KEYWORD}" are reserved and cannot be used.` })
            ],
            options: [
                option("-E, --registry-endpoint <endpoint>", { name: "registryEndpoint", label: "Registry endpoint", description: "Endpoint URL for the registry." })
            ],
            requirements: {}
        },
        {
            id: "registry:rm",
            command: "registry",
            subcommand: "rm",
            title: "Remove registry",
            group: "registry",
            guiRelevant: false,
            description: "Remove a registry alias.",
            icon: "DatabaseX",
            arguments: [
                argument(0, { name: "registryName", cliName: "registry name", label: "Registry name", description: `Registry alias to remove. "${PUBLIC_RESERVED_KEYWORD}" and "${LOCAL_RESERVED_KEYWORD}" are protected and cannot be deleted.` })
            ],
            options: [],
            requirements: {}
        }
    ];
    protected async handler(): Promise<void> {
        const registryName = this.args.registryName.trim();
        if (this.subcommand === 'add') {
            var endpoint = this.args.endpoint;
            if (registryName.toLowerCase() === PUBLIC_RESERVED_KEYWORD) {
                throw new Error(`Registry name "${PUBLIC_RESERVED_KEYWORD}" is a reserved keyword.`);
            }
            if (registryName.toLowerCase() === LOCAL_RESERVED_KEYWORD) {
                throw new Error(`Registry name "${LOCAL_RESERVED_KEYWORD}" is a reserved keyword.`);
            }
            const inq1 = await Inquirer.prompt({
                type: "input",
                name: "endpoint",
                message: "Registry endpoint",
                default: endpoint,
                when: !endpoint
            });
            endpoint = inq1.endpoint || endpoint;
            const registry = RegistryAlias.create(registryName, endpoint);
            var pingSuccess = true;
            try {
                const ping = await registry.getRegistry().ping();
                if (ping.messages) {
                    ping.messages.forEach(m => Logger.registryResponse(m));
                }
            } catch (e) {
                Logger.error(`Ping to registry "${registryName}" (${endpoint}) failed.`);
                pingSuccess = false;
                throw e;
            } finally {
                if (pingSuccess) {
                    Logger.success(`Registry "${registryName}" added.`);
                } else {
                    RegistryAlias.delete(registryName);
                }
            }
        } else if (this.subcommand === 'rm') {
            if (registryName.toLowerCase() === PUBLIC_RESERVED_KEYWORD) {
                throw new Error(`Registry "${PUBLIC_RESERVED_KEYWORD}" is protected and cannot be deleted.`);
            }
            if (registryName.toLowerCase() === LOCAL_RESERVED_KEYWORD) {
                throw new Error(`Registry "${LOCAL_RESERVED_KEYWORD}" is protected and cannot be deleted.`);
            }
            //use get (this will throw if the registry alias doesn't exist)
            RegistryAlias.get(registryName);
            RegistryAlias.delete(registryName);
            Logger.success(`Registry "${registryName}" has been removed.`);
        }
    }

}
