import { CommandArgumentMetadata, CommandFieldMetadata, CommandOptionMetadata } from "./CommandMetadata";

type FieldArgs =
    Omit<CommandFieldMetadata, "required" | "control"> &
    Partial<Pick<CommandFieldMetadata, "required" | "control">>;

type OptionArgs =
    FieldArgs &
    Partial<Pick<CommandOptionMetadata, "negated">>;

export function argument(position: number, args: FieldArgs): CommandArgumentMetadata {
    return {
        kind: "argument",
        position,
        name: args.name,
        cliName: args.cliName,
        label: args.label,
        description: args.description,
        required: args.required ?? true,
        control: args.control ?? "text-input",
        pickerType: args.pickerType,
        defaultValue: args.defaultValue,
        choices: args.choices,
        placeholder: args.placeholder,
        multiple: args.multiple,
        sensitive: args.sensitive,
        guiRelevant: args.guiRelevant
    };
}

export function option(flags: string, args: OptionArgs): CommandOptionMetadata {
    return {
        kind: "option",
        flags,
        negated: args.negated,
        name: args.name,
        cliName: args.cliName,
        label: args.label,
        description: args.description,
        required: args.required ?? false,
        control: args.control ?? "text-input",
        pickerType: args.pickerType,
        defaultValue: args.defaultValue,
        choices: args.choices,
        placeholder: args.placeholder,
        multiple: args.multiple,
        sensitive: args.sensitive,
        guiRelevant: args.guiRelevant
    };
}
