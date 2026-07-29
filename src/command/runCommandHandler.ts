import { getCommand, getCommandMetadata } from "./implementations";
import type { AbstractCommandRunOptions } from "./AbstractCommand";

export type CommandHandlerValues = Record<string, unknown>;

export type CommandHandlerOptions = AbstractCommandRunOptions;

export async function runCommandHandler(id: string, values: CommandHandlerValues = {}, options: CommandHandlerOptions = {}): Promise<void> {
    const commandClass = getCommand(id);
    const metadata = getCommandMetadata(id);

    if (!commandClass || !metadata) {
        throw new Error(`Unknown command metadata id "${id}".`);
    }

    const command = new commandClass(metadata.command, metadata.aliases, metadata.subcommand);
    await command.run(values, options);
}
