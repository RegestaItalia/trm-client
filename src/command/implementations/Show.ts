import chalk from "chalk";
import { compare, valid } from "semver";
import { Logger } from "trm-commons";
import { Namespace, PackageInfo } from "trm-registry-types";
import { AbstractCommand } from "../AbstractCommand";
import { CommandMetadata } from "../metadata/CommandMetadata";
import { argument } from "../metadata/helpers";
import { formatDate, isRegistryFeatureUnsupported, PackageSpec, parsePackageSpec, resolveFieldPath, toNavigationError } from "../../utils";

const VERSIONS_SHOWN = 10;

export type ShowData = PackageInfo & { manifest?: any, namespace?: Namespace };

/** Whether a field path needs the release manifest (and, for the namespace, its fallback). */
export function fieldNeedsManifest(field?: string): boolean {
    return !field || /^(manifest|postActivities|namespace)(\.|\[|$)/.test(field);
}

export function fieldNeedsNamespace(field?: string): boolean {
    return !field || /^namespace(\.|\[|$)/.test(field);
}

/** The value of a field path of the package data: `postActivities` is short for `manifest.postActivities`. */
export function resolveShowField(data: ShowData, field: string): any {
    var result = resolveFieldPath(data, field);
    if (!result.found && /^postActivities(\.|\[|$)/.test(field)) {
        result = resolveFieldPath(data, `manifest.${field}`);
    }
    if (!result.found) {
        throw new Error(`Field "${field}" not found.`);
    }
    return result.value;
}

/** A field value as printed: strings as is, anything else as pretty JSON. */
export function formatFieldValue(value: any): string {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

/** Newest versions first (semver order, publish date for non-semver versions). */
export function sortVersions(info: Pick<PackageInfo, 'versions' | 'version_dates'>): string[] {
    const dates = info.version_dates || {};
    return [...(info.versions || [])].sort((a, b) => {
        if (valid(a) && valid(b)) {
            return compare(b, a);
        }
        return String(dates[b] || '').localeCompare(String(dates[a] || ''));
    });
}

const postActivityParameters = (activity: any): string => {
    const parameters = activity?.parameters;
    if (!parameters) {
        return '';
    }
    if (Array.isArray(parameters)) {
        return parameters.map(p => p && typeof p === 'object' && 'name' in p
            ? `${p.name}=${typeof p.value === 'string' ? p.value : JSON.stringify(p.value)}`
            : JSON.stringify(p)).join(', ');
    }
    if (typeof parameters === 'object') {
        return Object.entries(parameters).map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`).join(', ');
    }
    return String(parameters);
};

/** The human readable package details, section by section. */
export function formatShow(data: ShowData): string {
    const lines: string[] = [];
    const section = (title: string) => {
        lines.push('');
        lines.push(chalk.bold(title));
    };

    lines.push(`${chalk.bold.green(data.name)}@${chalk.bold(data.version)}${data.private ? chalk.yellow(' (private)') : ''}`);
    if (data.description) {
        lines.push(data.description);
    }
    if (data.deprecated) {
        lines.push(chalk.red(`DEPRECATED${data.deprecated_message ? `: ${data.deprecated_message}` : ''}`));
    }
    const facts = [
        data.license ? `license: ${data.license}` : undefined,
        data.release_date ? `published: ${formatDate(data.release_date)}` : undefined,
        typeof data.downloads === 'number' ? `downloads: ${data.downloads}` : undefined
    ].filter(Boolean);
    if (facts.length > 0) {
        lines.push(chalk.gray(facts.join(' | ')));
    }

    const distTags = Object.entries(data.dist_tags || {});
    if (distTags.length > 0) {
        section('dist-tags:');
        distTags.forEach(([tag, version]) => lines.push(`  ${chalk.cyan(tag)}: ${version}`));
    }

    const versions = sortVersions(data);
    if (versions.length > 0) {
        section(`versions (${versions.length}):`);
        const yanked = data.yanked_versions || [];
        versions.slice(0, VERSIONS_SHOWN).forEach(version => {
            const date = formatDate(data.version_dates?.[version]);
            lines.push(`  ${version}${date ? chalk.gray(`  ${date}`) : ''}${yanked.includes(version) ? chalk.red('  (yanked)') : ''}`);
        });
        if (versions.length > VERSIONS_SHOWN) {
            lines.push(chalk.gray(`  and ${versions.length - VERSIONS_SHOWN} more`));
        }
    }

    if (data.keywords?.length > 0) {
        section('keywords:');
        lines.push(`  ${data.keywords.join(', ')}`);
    }
    if (data.maintainers?.length > 0) {
        section('maintainers:');
        data.maintainers.forEach(m => lines.push(`  ${m.name}${m.type === 'organization' ? chalk.gray(' (organization)') : ''}`));
    }

    if (data.dependencies?.length > 0) {
        section(`dependencies (${data.dependencies.length}):`);
        const width = Math.max(...data.dependencies.map(d => d.name.length));
        data.dependencies.forEach(d => lines.push(`  ${d.name.padEnd(width)}  ${d.version}`));
    }

    if (data.website || data.git) {
        section('links:');
        if (data.website) lines.push(`  website: ${data.website}`);
        if (data.git) lines.push(`  git: ${data.git}`);
    }

    if (data.namespace) {
        section('namespace:');
        lines.push(`  ${data.namespace.namespace}`);
        (data.namespace.descriptions || []).forEach(d => {
            lines.push(`  ${chalk.gray(`[${d.language}]`)} ${d.description}${d.owner ? chalk.gray(` (owner: ${d.owner})`) : ''}`);
        });
    } else if (data.has_namespace) {
        section('namespace:');
        lines.push(chalk.gray('  This release ships a namespace.'));
    }

    const postActivities: any[] = Array.isArray(data.manifest?.postActivities) ? data.manifest.postActivities : [];
    if (postActivities.length > 0) {
        section(`post activities (${postActivities.length}):`);
        postActivities.forEach(activity => {
            const parameters = postActivityParameters(activity);
            lines.push(`  ${activity?.name ?? JSON.stringify(activity)}${parameters ? chalk.gray(` (${parameters})`) : ''}`);
        });
    }

    return lines.join('\n');
}

export class Show extends AbstractCommand {

    public static readonly metadata: CommandMetadata = {
        id: "show",
        command: "show",
        title: "Show package",
        group: "package",
        guiRelevant: false,
        description: "Show registry information about a package release.",
        longDescription: `Shows a package release as published on the registry (no system connection), like "npm view".
With a field (a dotted path, e.g. versions, dist_tags.latest, manifest.postActivities) only its value is printed.
Package information is optional: some registries don't support it.`,
        icon: "PackageSearch",
        arguments: [
            argument(0, { name: "package", label: "Package", description: "Package name, optionally with version or distribution tag (name@version)." }),
            argument(1, { name: "field", label: "Field", description: "Dotted path of a single field to print.", required: false })
        ],
        options: [],
        requirements: {
            requiresRegistry: true
        }
    };

    private async fetch(spec: PackageSpec, field?: string): Promise<ShowData> {
        const registry = this.getRegistry();
        Logger.loading(`Reading ${spec.name}...`);
        var info: PackageInfo;
        try {
            info = await registry.getPackageInfo(spec.name, spec.version);
        } catch (e) {
            throw toNavigationError(e, spec);
        }
        const data: ShowData = { ...info };
        // the resolved version: a distribution tag is read once
        const version = info.version || spec.version;
        if (fieldNeedsManifest(field)) {
            try {
                data.manifest = (await registry.getManifest(spec.name, version)).manifest;
            } catch (e) {
                // without a field the details are shown anyway, just without the manifest sections
                if (field || !isRegistryFeatureUnsupported(e)) {
                    throw toNavigationError(e, spec);
                }
                Logger.log(`Manifest not available: ${e.message}`, true);
            }
        }
        if (fieldNeedsNamespace(field) && info.has_namespace) {
            try {
                data.namespace = await registry.getNamespace(spec.name, version);
            } catch (e) {
                if (!isRegistryFeatureUnsupported(e)) {
                    throw toNavigationError(e, spec);
                }
                Logger.log(`Namespace not available: ${e.message}`, true);
                const manifestNamespace = data.manifest?.namespace;
                if (manifestNamespace?.ns) {
                    data.namespace = {
                        namespace: manifestNamespace.ns,
                        descriptions: (manifestNamespace.texts || []).map(t => ({ language: t.language, description: t.description, owner: t.owner }))
                    };
                } else if (field) {
                    throw toNavigationError(e, spec);
                }
            }
        }
        return data;
    }

    protected async handler(): Promise<void> {
        const spec = parsePackageSpec(this.args.package);
        const field: string | undefined = typeof this.args.field === 'string' && this.args.field.trim() ? this.args.field.trim() : undefined;
        const data = await this.fetch(spec, field);
        if (field) {
            const value = resolveShowField(data, field);
            if (this.setJsonOutput(value)) {
                return;
            }
            Logger.log(formatFieldValue(value));
            return;
        }
        if (this.setJsonOutput(data)) {
            return;
        }
        Logger.log(formatShow(data));
    }

}
