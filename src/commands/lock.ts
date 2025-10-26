import { PUBLIC_RESERVED_KEYWORD, RegistryProvider, SystemConnector } from "trm-core";
import { LockArguments } from "./arguments";
import { CommandContext } from "./commons";
import { Logger } from "trm-commons";
import { writeFileSync } from "fs";

interface Lock {
    lockfileVersion: number,
    name?: string,
    version?: string,
    packages?: {
        name: string,
        version: string,
        registry: string,
        integrity: string
    }[]
}

function resolveRegistry(registry?: string): string {
    if (!registry || registry.trim().toLowerCase() === PUBLIC_RESERVED_KEYWORD) {
        return 'https://trmregistry.com/registry/';
    } else {
        return registry;
    }
}

export async function lock(commandArgs: LockArguments) {
    var lock: Lock = {
        lockfileVersion: 1,
        packages: []
    };
    const packages = await CommandContext.getSystemPackages();
    const root = packages.find(o => o.compareName(commandArgs.package) && o.compareRegistry(CommandContext.getRegistry()));
    if (!root) {
        throw new Error(`Package "${commandArgs.package}" not found`);
    }
    const rootManifest = root.manifest.get();
    var dependencies = rootManifest.dependencies || [];
    lock.name = rootManifest.name;
    lock.version = rootManifest.version;
    for (const dep of dependencies) {
        const registryResolved = resolveRegistry(dep.registry);
        if (!lock.packages.find(o => o.name === dep.name && o.registry === registryResolved)) {
            const depRegistry = RegistryProvider.getRegistry(dep.registry);
            const depPackage = packages.find(o => o.compareName(dep.name) && o.compareRegistry(depRegistry));
            if (depPackage) {
                const depManifest = depPackage.manifest.get();
                const depIntegrity = await SystemConnector.getPackageIntegrity(depPackage);
                lock.packages.push({
                    name: dep.name,
                    version: depManifest.version,
                    registry: registryResolved,
                    integrity: depIntegrity
                });
                dependencies = dependencies.concat(depManifest.dependencies || []);
            } else {
                Logger.warning(`Dependency "${dep.name}", registry "${registryResolved}" not found in system ${SystemConnector.getDest()}`);
            }
        }
    }
    writeFileSync(commandArgs.outputPath, JSON.stringify(lock, null, 2));
    Logger.info(`Generated lock file "${commandArgs.outputPath}"`);
}