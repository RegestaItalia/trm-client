import { execa } from "execa";
import os from "node:os";
import { Logger } from "trm-commons";

type PM = "npm" | "pnpm" | "yarn1";

export async function selfUpdate(): Promise<void> {
    const pm = detectPackageManager();
    const target = `trm-client@latest`;

    const command: { bin: string; args: string[] } =
        pm === "pnpm"
            ? { bin: "pnpm", args: ["add", "-g", target] }
            : pm === "yarn1"
                ? { bin: "yarn", args: ["global", "add", target] }
                : { bin: "npm", args: ["install", "-g", target] }; // default

    try {
        await execa(command.bin, command.args, { stdio: "inherit" });
        Logger.success(`Client updated successfully.`);
    } catch (err: any) {
        // Permission hiccups are the #1 failure for global installs
        if (isPermsError(err)) {
            Logger.error(formatPermsHelp(command.bin));
        }
        // Yarn modern (berry) users might have tried "yarn global"
        if (command.bin === "yarn" && looksLikeYarnBerry()) {
            Logger.error(`\Detected Yarn ≥2 (Berry). It doesn't support reliable global installs.\n` +
                `    Try: npm install -g ${target}`
            );
        }
        // Re-throw so your outer handler/logging sees the failure
        throw err;
    }
}

/* ---------- helpers ---------- */

function detectPackageManager(): PM {
    const ua = process.env.npm_config_user_agent ?? "";
    // Examples:
    //  - pnpm/9.0.0 npm/? node/20.11.1
    //  - yarn/1.22.22 npm/? node/20.12.2
    //  - npm/10.8.1 node/v20.15.0 darwin arm64
    if (ua.includes("pnpm/")) return "pnpm";
    if (ua.includes("yarn/1.")) return "yarn1";
    return "npm";
}

function looksLikeYarnBerry(): boolean {
    const ua = process.env.npm_config_user_agent ?? "";
    return ua.includes("yarn/") && !ua.includes("yarn/1.");
}

function isPermsError(err: any): boolean {
    const msg = String(err?.message || err);
    return (
        err?.code === "EACCES" ||
        err?.errno === -13 ||
        /EACCES|EPERM|permission denied/i.test(msg)
    );
}

function formatPermsHelp(bin: string): string {
    const isUnix = os.platform() !== "win32";
    return (
        `Permission error installing globally.\n` +
        `Troubleshooting tips:\n` +
        (isUnix
            ? `  • If you used a system Node, configure a user-level global prefix:\n` +
            `      mkdir -p ~/.npm-global && npm config set prefix ~/.npm-global\n` +
            `      export PATH="$HOME/.npm-global/bin:$PATH"\n` +
            `    (Then rerun: ${bin} …)\n` +
            `  • Prefer using a Node version manager (nvm/fnm/volta) to avoid sudo.\n` +
            `  • Avoid running global installs with sudo unless you know why.\n`
            : `  • Run your shell as Administrator, or use a Node manager (nvs/volta).\n`) +
        ``
    );
}