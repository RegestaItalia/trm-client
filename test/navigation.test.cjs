const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Command } = require('commander');
const core = require('trm-core');
const commons = require('trm-commons');
const commands = require('../dist/command/implementations');
const { buildSearchRequest, formatSearchFooter } = require('../dist/command/implementations/Search');
const { resolveShowField, formatFieldValue, formatShow, fieldNeedsManifest, sortVersions } = require('../dist/command/implementations/Show');
const { renderMarkdown, renderMarkdownBasic } = require('../dist/command/implementations/Readme');
const { parsePackageSpec, resolveFieldPath, toNavigationError } = require('../dist/utils/registryNavigation');

const logs = [];
const infos = [];
const errors = [];
const tables = [];
for (const name of ['loading', 'success', 'warning', 'tree']) {
    commons.Logger[name] = () => {};
}
commons.Logger.info = text => infos.push(String(text));
commons.Logger.table = (head, data) => tables.push({ head, data });
commons.Logger.log = (text, debug) => { if (!debug) logs.push(String(text)); };
commons.Logger.error = (error, debug) => { if (!debug) errors.push(String(error && error.message || error)); };

// eslint-disable-next-line no-control-regex
const plain = text => text.replace(/\u001b\[[0-9;]*m/g, '');
const reset = () => { logs.length = 0; infos.length = 0; errors.length = 0; tables.length = 0; };

const info = {
    name: '@acme/demo', version: '1.2.0', description: 'Demo package', license: 'MIT', release_date: '2026-10-01T10:00:00.000Z',
    private: true, deprecated: true, deprecated_message: 'use @acme/other', website: 'https://acme.example', git: 'https://git.example/demo',
    keywords: ['abap', 'demo'], maintainers: [{ name: 'acme', type: 'organization' }, { name: 'jane', type: 'user' }], downloads: 42,
    versions: Array.from({ length: 12 }, (_, i) => `1.${i}.0`),
    version_dates: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`1.${i}.0`, `2026-0${(i % 9) + 1}-01T00:00:00Z`])),
    yanked_versions: ['1.11.0'], dist_tags: { latest: '1.2.0', beta: '1.11.0' },
    dependencies: [{ name: 'dep-one', version: '^1.0.0' }], has_namespace: true
};
const manifest = { name: '@acme/demo', version: '1.2.0', postActivities: [{ name: 'ZCL_ACTIVITY', parameters: [{ name: 'MODE', value: 'X' }] }] };
const namespace = { namespace: '/ACME/', descriptions: [{ language: 'EN', description: 'Acme namespace', owner: 'Acme' }] };

test('navigation commands are registered with their metadata', () => {
    const search = commands.getCommandMetadata('search');
    assert.deepEqual(search.aliases, ['s', 'se']);
    assert.deepEqual(search.arguments.map(a => [a.name, a.required, !!a.multiple]), [['query', false, true]]);
    assert.deepEqual(search.options.map(o => o.name), ['keywords', 'maintainers', 'org', 'sort', 'page', 'limit']);
    const show = commands.getCommandMetadata('show');
    assert.deepEqual(show.arguments.map(a => [a.name, a.required]), [['package', true], ['field', false]]);
    const readme = commands.getCommandMetadata('readme');
    assert.deepEqual(readme.arguments.map(a => [a.name, a.required]), [['package', true]]);
    assert.ok(readme.options.some(o => o.name === 'raw'));
    for (const metadata of [search, show, readme]) {
        assert.ok(metadata.requirements.requiresRegistry);
        assert.ok(!metadata.requirements.onlyRegistryAlias, `${metadata.id} accepts -E/-A`);
        assert.ok(!metadata.requirements.registryAuthBlacklist, `${metadata.id} works on anonymous registries`);
        assert.ok(!metadata.requirements.requiresConnection);
    }
    assert.ok(commands.commands.includes(commands.Search));
    assert.ok(commands.commands.includes(commands.Show));
    assert.ok(commands.commands.includes(commands.Readme));
});

test('commander parses variadic search terms, aliases and registry options', () => {
    const program = new Command().exitOverride();
    const command = new commands.Search(program, 'search', ['s', 'se']);
    command.register();
    let received;
    command.command.action((...args) => { received = args; });
    program.parse(['node', 'trm', 'se', 'json', 'parser', '--org', 'acme', '-E', 'http://localhost:3000']);
    assert.deepEqual(received[0], ['json', 'parser']);
    assert.equal(command.command.opts().org, 'acme');
    assert.equal(command.command.opts().registryEndpoint, 'http://localhost:3000');
    assert.match(command.command.usage(), /\[query\.\.\.\]/);
});

test('package specs accept versions and scopes', () => {
    assert.deepEqual(parsePackageSpec('demo'), { name: 'demo', version: 'latest' });
    assert.deepEqual(parsePackageSpec('demo@1.0.0'), { name: 'demo', version: '1.0.0' });
    assert.deepEqual(parsePackageSpec('@org/name'), { name: '@org/name', version: 'latest' });
    assert.deepEqual(parsePackageSpec('@org/name@1.0.0'), { name: '@org/name', version: '1.0.0' });
    assert.deepEqual(parsePackageSpec('@org/name@beta'), { name: '@org/name', version: 'beta' });
    assert.deepEqual(parsePackageSpec('demo@'), { name: 'demo', version: 'latest' });
    assert.throws(() => parsePackageSpec(''), /Invalid package/);
    assert.throws(() => parsePackageSpec('@org/'), /Invalid package/);
});

test('search options become the registry request', () => {
    assert.deepEqual(buildSearchRequest({ query: ['json', 'parser'], page: 1, limit: 25 }), { q: 'json parser', page: 1, limit: 25 });
    assert.deepEqual(buildSearchRequest({ query: [], keywords: 'abap, json', maintainers: 'jane', org: '@acme,beta', sort: 'Downloads', page: '2', limit: '10' }),
        { keywords: ['abap', 'json'], maintainers: ['jane'], organizations: ['acme', 'beta'], sort: 'downloads', page: 2, limit: 10 });
    assert.deepEqual(buildSearchRequest({ query: 'demo' }), { q: 'demo', page: 1, limit: 25 });
    assert.throws(() => buildSearchRequest({ query: [] }), /search query or at least one filter/);
    assert.throws(() => buildSearchRequest({ query: ['  '], keywords: ' , ' }), /search query or at least one filter/);
    assert.throws(() => buildSearchRequest({ query: ['x'], sort: 'stars' }), /Invalid sort "stars"/);
    assert.throws(() => buildSearchRequest({ query: ['x'], limit: '26' }), /can't be greater than 25/);
    assert.throws(() => buildSearchRequest({ query: ['x'], page: '0' }), /--page must be a positive integer/);
    assert.throws(() => buildSearchRequest({ query: ['x'], limit: 'abc' }), /--limit must be a positive integer/);
});

test('search prints a table, the page footer and a next page hint', async () => {
    reset();
    let request;
    const result = {
        total: 120, page: 2, limit: 25,
        results: [{ name: '@acme/demo', version: '1.2.0', description: 'x'.repeat(80), maintainers: [{ name: 'acme', type: 'organization' }],
            release_date: '2026-10-01T10:00:00.000Z', downloads: 3, private: true }]
    };
    const registry = { name: 'local', search: async req => { request = req; return result; } };
    await new commands.Search('search').run({ query: ['demo'], page: '2' }, { registry });
    assert.deepEqual(request, { q: 'demo', page: 2, limit: 25 });
    assert.deepEqual(tables[0].head, ['Name', 'Version', 'Description', 'Maintainers', 'Date']);
    const row = tables[0].data[0].map(plain);
    assert.equal(row[0], '@acme/demo (private)');
    assert.equal(row[2].length, 60);
    assert.equal(row[3], 'acme');
    assert.equal(row[4], '2026-10-01');
    assert.match(plain(logs.join('\n')), /Showing 26-26 of 120 packages \(page 2\/5\)/);
    assert.match(plain(logs.join('\n')), /--page 3/);
    assert.equal(formatSearchFooter({ total: 120, page: 2, limit: 25, results: new Array(25) }), 'Showing 26-50 of 120 packages (page 2/5)');
});

test('search without results says so', async () => {
    reset();
    const registry = { name: 'local', search: async () => ({ total: 0, page: 1, limit: 25, results: [] }) };
    await new commands.Search('search').run({ query: ['nothing'] }, { registry });
    assert.deepEqual(infos, ['No packages found']);
    assert.equal(tables.length, 0);
});

test('field paths resolve into the merged package data', () => {
    const data = { ...info, manifest, namespace };
    assert.deepEqual(resolveFieldPath(data, 'dist_tags.latest'), { found: true, value: '1.2.0' });
    assert.deepEqual(resolveFieldPath(data, 'dist-tags.beta'), { found: true, value: '1.11.0' });
    assert.deepEqual(resolveFieldPath(data, 'versions[1]'), { found: true, value: '1.1.0' });
    assert.deepEqual(resolveFieldPath(data, 'maintainers.0.name'), { found: true, value: 'acme' });
    assert.deepEqual(resolveFieldPath(data, 'nope.deeper'), { found: false });
    assert.deepEqual(resolveFieldPath(data, 'name.length'), { found: false });
    assert.equal(resolveShowField(data, 'namespace.namespace'), '/ACME/');
    assert.deepEqual(resolveShowField(data, 'postActivities'), manifest.postActivities);
    assert.deepEqual(resolveShowField(data, 'manifest.postActivities.0.name'), 'ZCL_ACTIVITY');
    assert.throws(() => resolveShowField(data, 'unknown'), /Field "unknown" not found/);
    assert.equal(formatFieldValue('text'), 'text');
    assert.equal(formatFieldValue(['a']), '[\n  "a"\n]');
    assert.ok(fieldNeedsManifest(undefined));
    assert.ok(fieldNeedsManifest('manifest.version'));
    assert.ok(fieldNeedsManifest('postActivities'));
    assert.ok(fieldNeedsManifest('namespace'));
    assert.ok(!fieldNeedsManifest('versions'));
    assert.ok(!fieldNeedsManifest('manifestish'));
});

test('show prints every section of a release', () => {
    const text = plain(formatShow({ ...info, manifest, namespace }));
    assert.match(text, /^@acme\/demo@1\.2\.0 \(private\)\nDemo package\nDEPRECATED: use @acme\/other/);
    assert.match(text, /license: MIT \| published: 2026-10-01 \| downloads: 42/);
    assert.match(text, /beta: 1\.11\.0/);
    assert.match(text, /versions \(12\):\n  1\.11\.0  2026-03-01  \(yanked\)/);
    assert.match(text, /and 2 more/);
    assert.doesNotMatch(text, /  1\.0\.0/);
    assert.match(text, /abap, demo/);
    assert.match(text, /acme \(organization\)/);
    assert.match(text, /dep-one  \^1\.0\.0/);
    assert.match(text, /website: https:\/\/acme\.example/);
    assert.match(text, /\/ACME\/\n  \[EN\] Acme namespace \(owner: Acme\)/);
    assert.match(text, /post activities \(1\):\n  ZCL_ACTIVITY \(MODE=X\)/);
    assert.deepEqual(sortVersions({ versions: ['1.0.0', '1.10.0', '1.9.0'] }), ['1.10.0', '1.9.0', '1.0.0']);
});

test('show reads the manifest only when needed', async () => {
    reset();
    const calls = [];
    const registry = {
        name: 'local',
        getPackageInfo: async (name, version) => { calls.push(['info', name, version]); return info; },
        getManifest: async (name, version) => { calls.push(['manifest', name, version]); return { name, version, manifest }; },
        getNamespace: async (name, version) => { calls.push(['namespace', name, version]); return namespace; }
    };
    await new commands.Show('show').run({ package: '@acme/demo@latest', field: 'dist_tags.latest' }, { registry });
    assert.deepEqual(calls, [['info', '@acme/demo', 'latest']]);
    assert.deepEqual(logs, ['1.2.0']);

    reset(); calls.length = 0;
    await new commands.Show('show').run({ package: '@acme/demo', field: 'manifest.postActivities' }, { registry });
    assert.deepEqual(calls.map(c => c[0]), ['info', 'manifest']);
    // the resolved version is used once the distribution tag is read
    assert.equal(calls[1][2], '1.2.0');
    assert.deepEqual(JSON.parse(logs[0]), manifest.postActivities);

    reset(); calls.length = 0;
    await new commands.Show('show').run({ package: '@acme/demo' }, { registry });
    assert.deepEqual(calls.map(c => c[0]), ['info', 'manifest', 'namespace']);
    assert.match(plain(logs.join('\n')), /post activities/);

    reset();
    await assert.rejects(new commands.Show('show').run({ package: '@acme/demo', field: 'nope' }, { registry }));
    assert.match(errors.join('\n'), /Field "nope" not found/);
});

test('show without a field degrades when the manifest and namespace are unsupported', async () => {
    reset();
    const registry = {
        name: 'local',
        getPackageInfo: async () => info,
        getManifest: async () => { throw new core.RegistryFeatureUnsupportedError('manifest', 'http://localhost'); },
        getNamespace: async () => { throw new core.RegistryFeatureUnsupportedError('namespace', 'http://localhost'); }
    };
    await new commands.Show('show').run({ package: '@acme/demo' }, { registry });
    const text = plain(logs.join('\n'));
    assert.match(text, /This release ships a namespace/);
    assert.doesNotMatch(text, /post activities/);
    reset();
    await assert.rejects(new commands.Show('show').run({ package: '@acme/demo', field: 'manifest' }, { registry }));
    assert.deepEqual(errors, ['This registry does not support package manifests.']);
});

test('unsupported features and unknown packages get a friendly message', async () => {
    assert.equal(toNavigationError(new core.RegistryFeatureUnsupportedError('search', 'http://x', 501)).message, 'This registry does not support package search.');
    assert.equal(toNavigationError(new core.RegistryPackageNotFoundError('demo', '2.0.0', 'http://x')).message, 'Package not found: demo@2.0.0.');
    const other = new Error('boom');
    assert.equal(toNavigationError(other), other);

    const unsupported = feature => async () => { throw new core.RegistryFeatureUnsupportedError(feature, 'http://localhost', 501); };
    const cases = [
        [commands.Search, 'search', { query: ['demo'] }, { search: unsupported('search') }, 'This registry does not support package search.'],
        [commands.Show, 'show', { package: 'demo' }, { getPackageInfo: unsupported('info') }, 'This registry does not support package information.'],
        [commands.Readme, 'readme', { package: 'demo' }, { getReadme: unsupported('readme') }, 'This registry does not support package READMEs.'],
        [commands.Readme, 'readme', { package: '@org/demo@9.9.9' },
            { getReadme: async (name, version) => { throw new core.RegistryPackageNotFoundError(name, version, 'http://localhost'); } },
            'Package not found: @org/demo@9.9.9.']
    ];
    for (const [CommandClass, name, args, registry, expected] of cases) {
        reset();
        await assert.rejects(new CommandClass(name).run(args, { registry: { name: 'local', ...registry } }), /Action failed/);
        assert.deepEqual(errors, [expected]);
    }
});

test('readme prints the source, rendered markdown or a missing README notice', async () => {
    const markdown = '# Demo\n\nSome **bold** text and `code`.';
    const calls = [];
    const registry = { name: 'local', getReadme: async (name, version) => { calls.push([name, version]); return { name, version: '1.2.0', readme: markdown }; } };

    reset();
    await new commands.Readme('readme').run({ package: 'demo@1.2.0', raw: true }, { registry });
    assert.deepEqual(calls, [['demo', '1.2.0']]);
    assert.deepEqual(logs, [markdown]);

    reset();
    await new commands.Readme('readme').run({ package: 'demo' }, { registry });
    const rendered = plain(logs.join('\n'));
    assert.match(rendered, /Demo/);
    assert.match(rendered, /bold/);
    assert.doesNotMatch(rendered, /\*\*bold\*\*/);

    reset();
    const empty = { name: 'local', getReadme: async name => ({ name, version: '1.0.0', readme: null }) };
    await new commands.Readme('readme').run({ package: 'demo' }, { registry: empty });
    assert.deepEqual(infos, ['No README available for demo@1.0.0']);
    assert.equal(logs.length, 0);
});

test('markdown renders with marked-terminal and falls back to basic styling', async () => {
    const rendered = plain(await renderMarkdown('## Title\n\n- item'));
    assert.match(rendered, /Title/);
    assert.match(rendered, /item/);
    assert.doesNotMatch(rendered, /^## /m);
    const basic = plain(renderMarkdownBasic('# Title\nA [link](https://x.y) and `code`\n```\n# not a heading\n```'));
    assert.equal(basic, 'Title\nA link (https://x.y) and code\n```\n# not a heading\n```');
});
