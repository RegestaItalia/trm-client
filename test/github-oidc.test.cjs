const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { RegistryType } = require('trm-core');
const {
    authenticateRegistry,
    getGithubOidcAudience,
    isGithubOidcAuthData,
    getDefaultRegistryAuthData,
    GithubOidcTokenProvider,
    GITHUB_OIDC_PUBLIC_AUDIENCE
} = require('../dist/registryAlias/githubOidc');

function jwt(exp) {
    const part = o => Buffer.from(JSON.stringify(o)).toString('base64url');
    return `${part({ alg: 'RS256' })}.${part({ exp })}.signature`;
}

function fakeRegistry(type = RegistryType.PUBLIC, endpoint = 'https://www.trmregistry.com/registry') {
    const interceptors = [];
    const registry = {
        name: 'test',
        endpoint,
        authenticated: undefined,
        getRegistryType: () => type,
        authenticate: async data => {
            registry.authenticated = data;
            registry._axiosInstance = { interceptors: { request: { use: fn => interceptors.push(fn) } } };
            return registry;
        }
    };
    registry.interceptors = interceptors;
    return registry;
}

function headers(authorization) {
    let value = authorization;
    return {
        getAuthorization: () => value,
        setAuthorization: v => { value = v; },
        get value() { return value; }
    };
}

const savedEnv = {};
beforeEach(() => {
    for (const k of ['GITHUB_ACTIONS', 'ACTIONS_ID_TOKEN_REQUEST_URL', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN']) savedEnv[k] = process.env[k];
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://runner.example/token?api-version=2.0';
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'request-token';
});
afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
        if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
});

test('defaults to GitHub OIDC auth only in GitHub Actions with id-token permission', () => {
    process.env.GITHUB_ACTIONS = 'true';
    assert.deepEqual(getDefaultRegistryAuthData(), { oidc: 'github' });
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    assert.equal(getDefaultRegistryAuthData(), undefined);
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'request-token';
    delete process.env.GITHUB_ACTIONS;
    assert.equal(getDefaultRegistryAuthData(), undefined);
});

test('recognizes GitHub OIDC auth data only', () => {
    assert.equal(isGithubOidcAuthData({ oidc: 'github' }), true);
    assert.equal(isGithubOidcAuthData({ oidc: 'GitHub', audience: 'x' }), true);
    assert.equal(isGithubOidcAuthData({ token: 'trm_x' }), false);
    assert.equal(isGithubOidcAuthData(null), false);
});

test('audience defaults to trmregistry.com for public and to endpoint origin for private registries', () => {
    assert.equal(getGithubOidcAudience(fakeRegistry(), { oidc: 'github' }), GITHUB_OIDC_PUBLIC_AUDIENCE);
    assert.equal(getGithubOidcAudience(fakeRegistry(RegistryType.PRIVATE, 'https://reg.acme.com/api'), { oidc: 'github' }), 'https://reg.acme.com');
    assert.equal(getGithubOidcAudience(fakeRegistry(), { oidc: 'github', audience: 'custom' }), 'custom');
});

test('requests the token with the audience and the runner request token, and authenticates with it', async () => {
    const calls = [];
    const token = jwt(Math.floor(Date.now() / 1000) + 300);
    const registry = fakeRegistry();
    await authenticateRegistry(registry, { oidc: 'github' }, async (url, requestToken) => {
        calls.push({ url, requestToken });
        return token;
    });
    assert.equal(calls.length, 1);
    const url = new URL(calls[0].url);
    assert.equal(url.searchParams.get('audience'), 'https://trmregistry.com');
    assert.equal(url.searchParams.get('api-version'), '2.0');
    assert.equal(calls[0].requestToken, 'request-token');
    assert.deepEqual(registry.authenticated, { token });
    assert.equal(registry.interceptors.length, 1);
});

test('refreshes the bearer when the token is close to expiry', async () => {
    let n = 0;
    const tokens = [jwt(Math.floor(Date.now() / 1000) + 30), jwt(Math.floor(Date.now() / 1000) + 300)];
    const registry = fakeRegistry();
    await authenticateRegistry(registry, { oidc: 'github' }, async () => tokens[n++]);
    const h = headers(`Bearer ${tokens[0]}`);
    await registry.interceptors[0]({ headers: h });
    assert.equal(h.value, `Bearer ${tokens[1]}`);
    const h2 = headers(`Bearer ${tokens[1]}`);
    await registry.interceptors[0]({ headers: h2 });
    assert.equal(n, 2, 'valid token is reused');
    const noAuth = headers(undefined);
    await registry.interceptors[0]({ headers: noAuth });
    assert.equal(noAuth.value, undefined, 'requests without authorization are left untouched');
});

test('passes other auth data to the registry unchanged', async () => {
    const registry = fakeRegistry();
    await authenticateRegistry(registry, { token: 'trm_abc' }, async () => { throw new Error('not expected'); });
    assert.deepEqual(registry.authenticated, { token: 'trm_abc' });
    assert.equal(registry.interceptors.length, 0);
});

test('fails with a clear error outside GitHub Actions or without id-token permission', async () => {
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    await assert.rejects(new GithubOidcTokenProvider('a', async () => 'x').getToken(), /id-token: write/);
});
