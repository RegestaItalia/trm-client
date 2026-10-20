import { findNodePackage } from "trm-commons";

/**
 * Returns the package.json of trm-client or of a package it depends on.
 * Searched from the client location (like node resolves modules), so it works whatever the install layout is.
 * @param packageName package name
 * @returns the parsed package.json, or `undefined` if not found
 */
export function getInstalledPackage(packageName: string): any {
    return findNodePackage(packageName, [__dirname, process.cwd()])?.packageJson;
}
