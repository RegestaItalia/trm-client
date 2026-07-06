import { getCommand, getCommandMetadata } from "./implementations";
import type * as Core from "trm-core";

export type CommandHandlerValues = Record<string, unknown>;

export interface CommandHandlerOptions {
    registry?: Core.AbstractRegistry;
}

export async function runCommandHandler(id: string, values: CommandHandlerValues = {}, options: CommandHandlerOptions = {}): Promise<void> {
    const commandClass = getCommand(id);
    const metadata = getCommandMetadata(id);

    if (!commandClass || !metadata) {
        throw new Error(`Unknown command metadata id "${id}".`);
    }

    const command = new commandClass(metadata.command, metadata.aliases, metadata.subcommand);
    await command.run(values, options);
}
