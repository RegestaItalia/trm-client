import chalk from "chalk";
import { valid } from "semver";
import { Logger } from "trm-commons";
import { RegistryDiffError, ReleaseDiffEntry, ReleaseDiffObject, ReleaseDiffReport, ReleaseDiffStatus } from "trm-core";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument, option } from "../metadata/helpers";

const STATUS_ORDER: ReleaseDiffStatus[] = ["modified", "added", "removed", "indeterminate"];

const statusLabel = (status: ReleaseDiffStatus): string => {
    switch (status) {
        case "added": return chalk.green("added");
        case "removed": return chalk.red("removed");
        case "modified": return chalk.yellow("modified");
        default: return chalk.gray(status);
    }
};

const valueText = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return value.length ? value : "(empty)";
    if (typeof value === "object") {
        const v = value as { display?: string; hex?: string };
        if (typeof v.display === "string") return `${v.display} (uncertain)`;
        if (typeof v.hex === "string") return `0x${v.hex}`;
        return JSON.stringify(value);
    }
    return String(value);
};

/** Readable lines of one changed entry (source hunks, table rows, other changes). */
export function formatDiffEntry(entry: ReleaseDiffEntry): string[] {
    const kind = entry.kind === "opaque" ? "rendered payload differences" : entry.kind === "operations" ? "import operations" : entry.kind;
    const lines = [`  ${chalk.bold(entry.name)} ${chalk.gray(`(${kind}, ${entry.status}${entry.fidelity === "rendered" ? ", uncertain" : ""})`)}`];
    if (entry.omission) {
        const summary = Object.entries(entry.changeSummary || {})
            .map(([key, value]) => `${key} ${typeof value === "object" ? JSON.stringify(value) : value}`).join(", ");
        lines.push(chalk.gray(`    Diff omitted because it is too large${summary ? ` (${summary})` : ""}.`));
        return lines;
    }
    if (entry.hunks) {
        for (const hunk of entry.hunks) {
            lines.push(chalk.cyan(`    @@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`));
            for (const line of hunk.lines) {
                if (line.kind === "add") lines.push(chalk.green(`    +${line.text}`));
                else if (line.kind === "delete") lines.push(chalk.red(`    -${line.text}`));
                else lines.push(`     ${line.text}`);
            }
        }
    } else if (entry.rows) {
        if (entry.keyMode === "multiset") {
            lines.push(chalk.gray("    Rows cannot be matched by key: listed as added or removed."));
        }
        for (const row of entry.rows) {
            const key = row.key ? Object.entries(row.key).map(([field, value]) => `${field}=${valueText(value)}`).join(", ") : "";
            lines.push(`    ${statusLabel(row.status)}${row.count && row.count > 1 ? ` ×${row.count}` : ""}${key ? ` ${key}` : ""}`);
            for (const field of row.fields || []) {
                lines.push(`      ${field.field}: ${chalk.red(valueText(field.before))} → ${chalk.green(valueText(field.after))}`);
            }
            if (!row.fields?.length && (row.after || row.before)) {
                lines.push(chalk.gray(`      ${Object.entries((row.after || row.before) as Record<string, unknown>)
                    .map(([field, value]) => `${field}=${valueText(value)}`).join(" · ")}`));
            }
        }
    } else if (entry.added || entry.removed) {
        for (const value of entry.removed || []) lines.push(chalk.red(`    -${valueText(value)}`));
        for (const value of entry.added || []) lines.push(chalk.green(`    +${valueText(value)}`));
    } else {
        lines.push(`    ${chalk.red(valueText(entry.before))} → ${chalk.green(valueText(entry.after))}`);
    }
    return lines;
}

/** The whole report as text: totals, notices, then each changed object with (unless `summary`) its entries. */
export function formatDiffReport(report: ReleaseDiffReport, title: string, summary: boolean): string {
    const changed = report.objects.filter(o => o.status !== "unchanged");
    const counts = STATUS_ORDER.map(status => [status, report.summary.objects[status] || 0] as const)
        .filter(([, count]) => count > 0).map(([status, count]) => `${count} ${status}`);
    const lines = [chalk.bold(`${title}: ${counts.length ? counts.join(", ") : "no differences"}`)];
    const policy = report.comparison?.detailPolicy;
    if (policy?.mode === "summary-only") {
        lines.push(chalk.gray("The comparison is too large for line-level details; every changed object is listed."));
    } else if (policy?.omittedEntries) {
        lines.push(chalk.gray(`${policy.omittedEntries} diffs are summarized because they are too large.`));
    }
    if (report.before?.coverage?.completeLogs === false || report.after?.coverage?.completeLogs === false) {
        lines.push(chalk.gray("Some release logs are incomplete: absent content is marked indeterminate."));
    }
    const entries = new Map(report.entries.map(entry => [entry.id, entry]));
    const order = (o: ReleaseDiffObject) => STATUS_ORDER.indexOf(o.status);
    for (const object of [...changed].sort((a, b) => order(a) - order(b) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name))) {
        if (!summary) lines.push("");
        lines.push(`${statusLabel(object.status)} ${chalk.gray(object.type)} ${chalk.bold(object.name)}${object.fidelity === "rendered" ? chalk.gray(" (uncertain)") : ""}`);
        if (!summary) {
            for (const id of object.entryIds) {
                const entry = entries.get(id);
                if (entry) lines.push(...formatDiffEntry(entry));
            }
        }
    }
    if (changed.length > 0) {
        lines.push("");
        lines.push(chalk.gray("Compared from the releases' transport exports: added/removed means present/absent in an export."));
    }
    return lines.join("\n");
}

export class Diff extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "diff",
        command: "diff",
        title: "Diff",
        group: "registry",
        guiRelevant: false,
        description: "Show what changed between two releases of a package.",
        icon: "GitCompare",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name." }),
            argument(1, { name: "from", label: "From", description: "Older release version or distribution tag." }),
            argument(2, { name: "to", label: "To", description: "Newer release version or distribution tag.", required: false, defaultValue: "latest" })
        ],
        options: [
            option("-s, --summary", { name: "summary", label: "Summary", description: "List the changed objects only, without their line-level changes.", control: "checkbox", defaultValue: false })
        ],
        requirements: {
            requiresRegistry: true
        }
    };

    /** A version or distribution tag (e.g. "latest") as the registry's release version. */
    private async resolveVersion(packageName: string, version: string): Promise<string> {
        if (valid(version)) {
            return version;
        }
        const view = await this.getRegistry().getPackage(packageName, version);
        const resolved = view?.manifest?.version;
        if (!resolved) {
            throw new Error(`Cannot resolve version "${version}" of ${packageName}.`);
        }
        return resolved;
    }

    protected async handler(): Promise<void> {
        const packageName: string = this.args.package;
        const from = await this.resolveVersion(packageName, this.args.from);
        const to = await this.resolveVersion(packageName, this.args.to || "latest");
        if (from === to) {
            throw new Error(`${packageName} ${from} is compared with itself: choose two different releases.`);
        }
        const registry = this.getRegistry();
        Logger.loading(`Comparing ${packageName} ${from} → ${to}...`);
        let report: ReleaseDiffReport;
        try {
            report = await registry.diff(packageName, from, to, {
                onProgress: progress => Logger.loading(`${progress.message || "Comparing releases"} (${progress.step}/${progress.steps})...`)
            });
        } catch (e) {
            if (e instanceof RegistryDiffError && e.proPlanRequired) {
                throw new Error(`Comparing releases on registry "${registry.name}" requires an active Pro plan.`);
            }
            if (e instanceof RegistryDiffError && e.status === 401) {
                throw new Error(`Comparing releases on registry "${registry.name}" requires login with a Pro plan.`);
            }
            throw e;
        }
        if (this.setJsonOutput({ package: packageName, from, to, report })) {
            return;
        }
        Logger.log(formatDiffReport(report, `${packageName} ${from} → ${to}`, !!this.args.summary));
    }

}
