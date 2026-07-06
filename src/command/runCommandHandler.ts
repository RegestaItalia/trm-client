import { getCommand, getCommandMetadata } from "./implementations";

export type CommandHandlerValues = Record<string, unknown>;

export async function runCommandHandler(id: string, values: CommandHandlerValues = {}): Promise<void> {
    const commandClass = getCommand(id);
    const metadata = getCommandMetadata(id);

    if (!commandClass || !metadata) {
        throw new Error(`Unknown command metadata id "${id}".`);
    }

    const command = new commandClass(metadata.command, metadata.aliases, metadata.subcommand);
    await command.run(values);
}
