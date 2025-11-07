import { AuthenticationType } from "trm-registry-types";

export interface RegisterCommandOpts {
    /**
     * sets connection arguments
     */
    requiresConnection?: boolean,
    /**
     * add no connection option (needs connection)
     */
    addNoConnection?: boolean,
    /**
     * don't execute if trm dependencies arent met (needs connection)
     */
    requiresTrmDependencies?: boolean,
    /**
     * don't execute without connection to registry
     */
    requiresRegistry?: boolean,
    /**
     * restricts registry usage to alias only (needs registry)
     */
    onlyRegistryAlias?: boolean,
    /**
     * skip registry requirement if matches authentication type
     */
    registryAuthBlacklist?: AuthenticationType[],
    /**
     * skips alias creation during connection
     */
    noSystemAlias?: boolean,
    /**
     * allow execution if connection to the registry fails (needs registry)
     */
    ignoreRegistryUnreachable?: boolean,
    /**
     * needs r3trans
     */
    requiresR3trans?: boolean
}