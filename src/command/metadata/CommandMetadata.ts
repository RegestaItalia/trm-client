import { RegisterCommandOpts } from "../RegisterCommandOpts";
import type { AbstractCommand } from "../AbstractCommand";

export type CommandControlType =
    | "text-input"
    | "password-input"
    | "number-input"
    | "checkbox"
    | "select"
    | "multiselect"
    | "file-picker"
    | "textarea"
    | "transport-layer-picker"
    | "transport-target-picker"
    | "sap-package-picker";

export interface CommandValueChoice {
    label: string;
    value: string | number | boolean;
    description?: string;
}

export interface CommandFieldMetadata {
    name: string;
    cliName?: string;
    label: string;
    description: string;
    required: boolean;
    control: CommandControlType;
    pickerType?: "input" | "output";
    defaultValue?: unknown;
    choices?: CommandValueChoice[];
    placeholder?: string;
    multiple?: boolean;
    sensitive?: boolean;
    guiRelevant?: boolean;
}

export interface CommandArgumentMetadata extends CommandFieldMetadata {
    kind: "argument";
    position: number;
}

export interface CommandOptionMetadata extends CommandFieldMetadata {
    kind: "option";
    flags: string;
    negated?: boolean;
}

export type CommandGroup =
    | "package"
    | "registry"
    | "system"
    | "utility";

export interface CommandMetadata {
    id: string;
    command: string;
    subcommand?: string;
    aliases?: string[];
    title: string;
    group: CommandGroup;
    groupPriority?: number;
    guiRelevant?: boolean;
    description: string;
    longDescription?: string;
    icon: string;
    arguments: CommandArgumentMetadata[];
    options: CommandOptionMetadata[];
    requirements: RegisterCommandOpts;
}

export type CommandMetadataExport = CommandMetadata | CommandMetadata[];

export interface CommandMetadataProvider {
    readonly metadata: CommandMetadataExport;
}

export interface CommandClass extends CommandMetadataProvider {
    new (program: import("commander").Command, name: string, aliases?: string[], subcommand?: string): AbstractCommand;
    new (name: string, aliases?: string[], subcommand?: string): AbstractCommand;
}
