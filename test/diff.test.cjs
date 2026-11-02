const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('trm-core');
const commons = require('trm-commons');
const commands = require('../dist/command/implementations');
const { formatDiffReport } = require('../dist/command/implementations/Diff');

const logs = [];
const errors = [];
for (const name of ['loading', 'success', 'info', 'warning', 'tree', 'table']) {
    commons.Logger[name] = () => {};
}
commons.Logger.log = text => logs.push(String(text));
commons.Logger.error = error => errors.push(String(error && error.message || error));

// eslint-disable-next-line no-control-regex
const plain = text => text.replace(/\u001b\[[0-9;]*m/g, '');

const report = {
    format: 'trm.transport-log-diff',
    version: 2,
    comparison: { detailPolicy: { mode: 'adaptive', omittedEntries: 1 } },
    summary: { objects: { modified: 2, added: 1, unchanged: 3 }, changedEntries: 3 },
    objects: [
        { id: 'R3TR/CLAS/ZCL_A', type: 'CLAS', name: 'ZCL_A', status: 'modified', entryIds: ['src', 'big'] },
        { id: 'R3TR/TABU/ZCONF', type: 'TABU', name: 'ZCONF', status: 'modified', entryIds: ['tab'] },
        { id: 'R3TR/PROG/ZNEW', type: 'PROG', name: 'ZNEW', status: 'added', entryIds: [] },
        { id: 'R3TR/PROG/ZSAME', type: 'PROG', name: 'ZSAME', status: 'unchanged', entryIds: [] }
    ],
    entries: [
        { id: 'src', objectId: 'R3TR/CLAS/ZCL_A', kind: 'source', name: 'methods/RUN.abap', status: 'modified', fidelity: 'exact',
          hunks: [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: [
              { kind: 'delete', oldLine: 1, newLine: null, text: "WRITE 'old'." },
              { kind: 'add', oldLine: null, newLine: 1, text: "WRITE 'new'." }] }] },
        { id: 'big', objectId: 'R3TR/CLAS/ZCL_A', kind: 'source', name: 'methods/BIG.abap', status: 'modified',
          omission: { reason: 'entry-limit', detailBytes: 99999 }, changeSummary: { addedLines: 900, removedLines: 2 } },
        { id: 'tab', objectId: 'R3TR/TABU/ZCONF', kind: 'table', name: 'ZCONF', status: 'modified', keyMode: 'primary-key',
          rows: [{ status: 'modified', key: { KEY: 'A' }, fields: [{ field: 'VALUE', before: '1', after: '2' }] }] }
    ]
};

test('diff is registered with its arguments and Pro-aware help', () => {
    const metadata = commands.getCommandMetadata('diff');
    assert.deepEqual(metadata.arguments.map(a => [a.name, a.required]), [['package', true], ['from', true], ['to', false]]);
    assert.equal(metadata.arguments[2].defaultValue, 'latest');
    assert.ok(metadata.requirements.requiresRegistry);
    assert.ok(metadata.options.some(o => o.name === 'summary'));
});

test('the report lists changed objects with their source and table changes', () => {
    const text = plain(formatDiffReport(report, 'demo 1.0.0 → 2.0.0', false));
    assert.match(text, /^demo 1\.0\.0 → 2\.0\.0: 2 modified, 1 added/);
    assert.match(text, /1 diffs are summarized because they are too large/);
    assert.match(text, /-WRITE 'old'\./);
    assert.match(text, /\+WRITE 'new'\./);
    assert.match(text, /VALUE: 1 → 2/);
    assert.match(text, /Diff omitted because it is too large \(addedLines 900, removedLines 2\)/);
    assert.match(text, /added PROG ZNEW/);
    assert.doesNotMatch(text, /ZSAME/);
    // modified objects come before added ones
    assert.ok(text.indexOf('ZCL_A') < text.indexOf('ZNEW'));
});

test('summary mode lists objects without their changes', () => {
    const text = plain(formatDiffReport(report, 'demo', true));
    assert.match(text, /modified CLAS ZCL_A/);
    assert.doesNotMatch(text, /WRITE/);
    assert.doesNotMatch(text, /\n\n.*modified TABU/);
});

test('diff resolves distribution tags and prints the registry report', async () => {
    logs.length = 0;
    const calls = [];
    const registry = {
        name: 'public',
        getPackage: async (name, version) => ({ manifest: { version: version === 'latest' ? '2.0.0' : version } }),
        diff: async (name, from, to, options) => { calls.push([name, from, to]); options.onProgress({ step: 1, steps: 3 }); return report; }
    };
    await new commands.Diff('diff').run({ package: 'demo', from: '1.0.0', to: 'latest' }, { registry });
    assert.deepEqual(calls, [['demo', '1.0.0', '2.0.0']]);
    assert.match(plain(logs.join('\n')), /demo 1\.0\.0 → 2\.0\.0: 2 modified, 1 added/);
});

test('diff explains Pro plan and login refusals', async () => {
    const cases = [
        [new core.RegistryDiffError('e', 'Comparing releases requires an active Pro plan', 402, 'PRO_PLAN_REQUIRED'), /requires an active Pro plan/],
        [new core.RegistryDiffError('e', 'Sign in', 401, 'AUTHENTICATION_REQUIRED'), /requires login with a Pro plan/]
    ];
    for (const [error, expected] of cases) {
        errors.length = 0;
        const registry = { name: 'public', getPackage: async () => ({ manifest: { version: '2.0.0' } }), diff: async () => { throw error; } };
        await assert.rejects(new commands.Diff('diff').run({ package: 'demo', from: '1.0.0', to: '2.0.0' }, { registry }));
        assert.match(errors.join('\n'), expected);
    }
});

test('diff refuses to compare a release with itself', async () => {
    errors.length = 0;
    const registry = { name: 'public', getPackage: async () => ({ manifest: { version: '2.0.0' } }), diff: async () => assert.fail('no request') };
    await assert.rejects(new commands.Diff('diff').run({ package: 'demo', from: '2.0.0', to: 'latest' }, { registry }));
    assert.match(errors.join('\n'), /compared with itself/);
});
