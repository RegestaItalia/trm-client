import axios from "axios";
import { AbstractRegistry, RegistryType } from "trm-core";
import { Logger } from "trm-commons";

/**
 * GitHub Actions OIDC authentication for registries.
 *
 * Registry auth data `{"oidc":"github"}` (optionally with `"audience"`) makes the client request a
 * short-lived GitHub Actions OIDC token and send it as the registry bearer token, instead of a
 * long-lived personal access token. GitHub OIDC tokens expire after a few minutes, so a fresh
 * token is requested whenever the current one is close to expiry.
 */

export const GITHUB_OIDC_PUBLIC_AUDIENCE = "https://trmregistry.com";
const REFRESH_MARGIN_SECONDS = 60;

export type GithubOidcAuthData = {
    oidc: "github",
    audience?: string
};

export type GithubOidcTokenFetcher = (requestUrl: string, requestToken: string) => Promise<string>;

export function isGithubOidcAuthData(authData: any): authData is GithubOidcAuthData {
    return !!authData && typeof authData === "object" && typeof authData.oidc === "string" && authData.oidc.trim().toLowerCase() === "github";
}

/**
 * Default registry auth data when none is provided: GitHub OIDC when running in a GitHub Actions job
 * that can request OIDC tokens (GITHUB_ACTIONS is always "true" on Actions runners, the token request
 * variables are only set with "permissions: id-token: write").
 */
export function getDefaultRegistryAuthData(): GithubOidcAuthData | undefined {
    if (process.env.GITHUB_ACTIONS === "true" && process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
        return { oidc: "github" };
    }
}

export function getGithubOidcAudience(registry: AbstractRegistry, authData: GithubOidcAuthData): string {
    if (authData.audience) {
        return authData.audience;
    }
    if (registry.getRegistryType() === RegistryType.PUBLIC) {
        return GITHUB_OIDC_PUBLIC_AUDIENCE;
    }
    return new URL(registry.endpoint).origin;
}

function getJwtExpiry(token: string): number | undefined {
    try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
        return typeof payload.exp === "number" ? payload.exp : undefined;
    } catch {
        return undefined;
    }
}

const defaultFetcher: GithubOidcTokenFetcher = async (requestUrl, requestToken) => {
    const response = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${requestToken}` }
    });
    return response.data?.value;
};

export class GithubOidcTokenProvider {
    private _token: string;
    private _expiry: number;

    constructor(public readonly audience: string, private _fetcher: GithubOidcTokenFetcher = defaultFetcher) { }

    public async getToken(): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        if (this._token && (!this._expiry || this._expiry - REFRESH_MARGIN_SECONDS > now)) {
            return this._token;
        }
        const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
        const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
        if (!requestUrl || !requestToken) {
            throw new Error(`GitHub Actions OIDC token is not available. Run the command in a GitHub Actions job with "permissions: id-token: write".`);
        }
        const url = new URL(requestUrl);
        url.searchParams.set("audience", this.audience);
        Logger.log(`Requesting GitHub Actions OIDC token for audience ${this.audience}`, true);
        var token: string;
        try {
            token = await this._fetcher(url.toString(), requestToken);
        } catch (e) {
            throw new Error(`Couldn't get a GitHub Actions OIDC token: ${e?.message || e}`);
        }
        if (!token || typeof token !== "string") {
            throw new Error(`Couldn't get a GitHub Actions OIDC token: empty response.`);
        }
        this._token = token;
        this._expiry = getJwtExpiry(token);
        return token;
    }
}

/**
 * Authenticates the registry with the given auth data.
 * GitHub OIDC auth data is turned into a bearer token that's refreshed before each request when needed.
 */
export async function authenticateRegistry(registry: AbstractRegistry, authData: any, fetcher?: GithubOidcTokenFetcher): Promise<void> {
    if (!isGithubOidcAuthData(authData)) {
        await registry.authenticate(authData);
        return;
    }
    const provider = new GithubOidcTokenProvider(getGithubOidcAudience(registry, authData), fetcher);
    await registry.authenticate({ token: await provider.getToken() });
    // the registry recreates its HTTP client on authentication: refresh the bearer on that client
    const axiosInstance = (registry as any)._axiosInstance;
    if (axiosInstance?.interceptors?.request) {
        axiosInstance.interceptors.request.use(async (config) => {
            if (config.headers?.getAuthorization && config.headers.getAuthorization()) {
                config.headers.setAuthorization(`Bearer ${await provider.getToken()}`);
            }
            return config;
        });
    } else {
        Logger.warning(`Registry "${registry.name}" doesn't support GitHub OIDC token refresh: long runs may fail when the token expires.`);
    }
}
