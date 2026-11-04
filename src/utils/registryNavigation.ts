import { RegistryFeatureUnsupportedError, RegistryPackageNotFoundError } from "trm-core";

/** A `<package>[@version]` argument, e.g. `name`, `name@1.0.0`, `@org/name` or `@org/name@latest`. */
export interface PackageSpec {
    name: string;
    version: string;
}

export function parsePackageSpec(spec: string, defaultVersion: string = 'latest'): PackageSpec {
    const value = (spec || '').trim();
    // the first character may be the scope "@": the version separator is a later "@"
    const separator = value.lastIndexOf('@');
    if (separator > 0) {
        const name = value.substring(0, separator);
        const version = value.substring(separator + 1);
        if (!name || name.endsWith('/')) {
            throw new Error(`Invalid package "${spec}".`);
        }
        return { name, version: version || defaultVersion };
    }
    if (!value || value === '@' || value.endsWith('/')) {
        throw new Error(`Invalid package "${spec}".`);
    }
    return { name: value, version: defaultVersion };
}

const FEATURE_LABELS: Record<string, string> = {
    search: 'package search',
    info: 'package information',
    readme: 'package READMEs',
    manifest: 'package manifests',
    namespace: 'package namespaces'
};

export function isRegistryFeatureUnsupported(e: any): e is RegistryFeatureUnsupportedError {
    return e instanceof RegistryFeatureUnsupportedError || e?.name === 'RegistryFeatureUnsupportedError';
}

export function isRegistryPackageNotFound(e: any): e is RegistryPackageNotFoundError {
    return e instanceof RegistryPackageNotFoundError || e?.name === 'RegistryPackageNotFoundError';
}

export function getRegistryFeatureUnsupportedMessage(feature: string): string {
    return `This registry does not support ${FEATURE_LABELS[feature] || feature}.`;
}

/**
 * Errors of the optional registry navigation APIs as user-facing errors:
 * unsupported features and unknown packages get a short message, anything else is returned as is.
 */
export function toNavigationError(e: any, packageSpec?: PackageSpec): Error {
    if (isRegistryFeatureUnsupported(e)) {
        return new Error(getRegistryFeatureUnsupportedMessage(e.feature));
    }
    if (isRegistryPackageNotFound(e)) {
        const name = packageSpec?.name || e.packageName;
        const version = packageSpec?.version || e.requestedVersion;
        return new Error(`Package not found: ${name}${version && version !== 'latest' ? `@${version}` : ''}.`);
    }
    return e;
}

export type FieldPathResult = { found: true, value: any } | { found: false };

/**
 * Resolves a dotted path (e.g. `dist_tags.latest`, `versions.0`, `versions[0]`, `manifest.postActivities`) in an object.
 * A segment that doesn't match a key also tries its "-"/"_" variant (`dist-tags` → `dist_tags`).
 */
export function resolveFieldPath(source: any, path: string): FieldPathResult {
    const segments = (path || '').replace(/\[(\w+)\]/g, '.$1').split('.').filter(s => s.length > 0);
    if (segments.length === 0) {
        return { found: false };
    }
    var value = source;
    for (const segment of segments) {
        if (value === null || value === undefined || typeof value !== 'object') {
            return { found: false };
        }
        const key = [segment, segment.replace(/-/g, '_'), segment.replace(/_/g, '-')]
            .find(k => Object.prototype.hasOwnProperty.call(value, k));
        if (key === undefined) {
            return { found: false };
        }
        value = value[key];
    }
    if (value === undefined) {
        return { found: false };
    }
    return { found: true, value };
}

/** ISO date as yyyy-mm-dd, empty when missing or invalid. */
export function formatDate(value?: string): string {
    if (!value) {
        return '';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return String(value);
    }
    return date.toISOString().substring(0, 10);
}

export function truncate(value: string | undefined, length: number): string {
    const text = (value || '').replace(/\s+/g, ' ').trim();
    return text.length > length ? `${text.substring(0, length - 1)}…` : text;
}

/** Native dynamic import, kept as is by the CommonJS build (needed for ESM-only packages). */
export const importEsm: (specifier: string) => Promise<any> = new Function('specifier', 'return import(specifier)') as any;
