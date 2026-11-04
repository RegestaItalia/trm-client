import { GlobalContext } from "./GlobalContext";

/**
 * Whether the user opted in to anonymous telemetry (`trm settings -s telemetry=true`). Disabled by default.
 * Settings set in this process are still strings until the settings file is read again.
 */
export function isTelemetryEnabled(): boolean {
    try {
        const value: unknown = GlobalContext.getInstance().getSettings().telemetry;
        return value === true || value === 'true';
    } catch {
        return false;
    }
}
