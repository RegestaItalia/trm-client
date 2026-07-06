import { Command } from "commander";
import { CommandMetadata } from "./CommandMetadata";

function argumentToken(argument: CommandMetadata["arguments"][number]): string {
    const name = argument.cliName ?? argument.name;
    return argument.required ? `<${name}>` : `[${name}]`;
}

export function applyCommandMetadata(command: Command, metadata: CommandMetadata): void {
    if (metadata.aliases?.length) {
        command.aliases(metadata.aliases);
    }

    command.description(metadata.description);

    if (metadata.longDescription) {
        command.addHelpText("before", metadata.longDescription);
    }

    [...metadata.arguments]
        .sort((a, b) => a.position - b.position)
        .forEach(argument => {
            command.argument(argumentToken(argument), argument.description, argument.defaultValue as never);
        });

    metadata.options.forEach(option => {
        command.option(option.flags, option.description, option.defaultValue as never);
    });
}
