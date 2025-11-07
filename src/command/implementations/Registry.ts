import { LOCAL_RESERVED_KEYWORD, PUBLIC_RESERVED_KEYWORD } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { Inquirer, Logger } from "trm-commons";
import { RegistryAlias } from "../../registryAlias";

export class Registry extends AbstractCommand {

    protected init(): void {
        this.registerOpts.requiresRegistry = true;
        if (this.name.includes('add')) {
            this.command.description(`Add a new registry.`);
            this.command.argument(`<registry name>`, `Name of the registry to generate. Name "${PUBLIC_RESERVED_KEYWORD}" and "${LOCAL_RESERVED_KEYWORD}" are protected and cannot be used.`);
        } else if (this.name.includes('rm')) {
            this.command.description(`Remove a registry.`);
            this.command.argument(`<registry name>`, `Name of the registry to delete. Registries "${PUBLIC_RESERVED_KEYWORD}" and "${LOCAL_RESERVED_KEYWORD}" are protected and cannot be deleted.`);
        }
        this.command.option(`-E, --registry-endpoint <endpoint>`, `Registry endpoint.`);
    }

    protected async handler(): Promise<void> {
        const registryName = this.args.registryName.trim();
        if (this.args.add && this.args.add.trim().toLowerCase() === 'add') {
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
        } else if (this.args.rm && this.args.rm.trim().toLowerCase() === 'rm') {
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
        } else {
            throw new Error(`Unknown command.`);
        }
    }

}