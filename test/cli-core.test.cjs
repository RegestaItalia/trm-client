const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Command } = require('commander');
const core = require('trm-core');
const { Lockfile } = require('trm-core/dist/lockfile');
const commons = require('trm-commons');
const commands = require('../dist/command/implementations');
const { GlobalContext } = require('../dist/utils/GlobalContext');

GlobalContext.getInstance = () => ({ getSettings: () => ({}) });
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trm-cli-test-'));
require('../dist/utils/getTempFolder').getTempFolder = () => tempDir;
for (const name of ['loading', 'success', 'info', 'warning', 'tree', 'table']) {
    commons.Logger[name] = () => {};
}

const registry = {};
const systemPackages = [];
function parse(CommandClass, name, argv) {
    const program = new Command().exitOverride();
    const command = new CommandClass(program, name);
    command.command.action(() => {});
    program.parse(['node', 'trm', name, ...argv]);
    const values = { ...command.command.opts() };
    const metadata = commands.getCommandMetadata(name);
    metadata.arguments.forEach((field, index) => {
        if (command.command.args[index] !== undefined) values[field.name] = command.command.args[index];
    });
    return { command, values };
}
function mockAction(name, output) {
    const action = require(`trm-core/dist/actions/${name}`);
    let input;
    action[name] = async value => { input = value; return output; };
    return () => input;
}

test('installation variants forward current options and lockfile paths', async () => {
    const input = mockAction('install', { manifest: { name: 'demo', version: '1.0.0' } });
    const lockfile = path.join(tempDir, 'custom-lock.json');
    fs.writeFileSync(lockfile, JSON.stringify({ lockfileVersion: 1, source: 'DEV', packages: [] }));
    for (const name of ['install', 'update', 'clean-install']) {
        const argv = ['demo', '--no-prompts', '--no-engines', '--allow-downgrade', '--keep-original',
            '--skip-post-activities', '--integrity', 'expected', '--landscape-tr-target', 'QAS'];
        if (name === 'clean-install') argv.push('--lock-file', lockfile);
        const { command, values } = parse(commands.Install, name, argv);
        await command.run(values, { registry, systemPackages });
        const result = input();
        //clean-install leaves the version to the lockfile root
        assert.equal(result.packageData.version, name === 'clean-install' ? undefined : 'latest');
        assert.equal(result.contextData.noInquirer, true);
        assert.equal(result.installData.checks.noEngines, true);
        assert.equal(result.installData.checks.noDependencies, false);
        assert.equal(result.installData.checks.allowDowngrade, true);
        assert.equal(result.installData.installDevclass.keepOriginal, true);
        assert.equal(result.installData.skipPostActivities, true);
        assert.equal(result.packageData.integrity, 'expected');
        assert.equal(result.installData.landscapeTransport.targetSystem, 'QAS');
        assert.equal(!!result.packageData.overwrite, name === 'update');
        if (name === 'clean-install') assert.ok(result.installData.checks.lockfile instanceof Lockfile);
        assert.ok(!('r3transOptions' in result.contextData));
        assert.ok(!('noObjectTypes' in result.installData.checks));
        assert.ok(!('installTransport' in result.installData));
    }
    const { command, values } = parse(commands.Install, 'install', ['demo']);
    await command.run(values, { registry, systemPackages });
    assert.equal(input().installData.checks.noEngines, false);
    assert.equal(input().contextData.noInquirer, false);
});

test('import resolves an extensionless local artifact and uses install options', async () => {
    const input = mockAction('install', { manifest: { name: 'demo', version: '1.0.0' } });
    const filename = path.join(tempDir, 'local');
    fs.writeFileSync(filename + '.trm', 'artifact');
    const { command, values } = parse(commands.Install, 'import', [filename, '--no-prompts', '--landscape-tr-target', 'QAS']);
    await command.run(values, { systemPackages });
    assert.equal(command.args.filename, filename + '.trm');
    assert.ok(input().packageData.registry instanceof core.FileSystem);
    assert.equal(input().installData.landscapeTransport.targetSystem, 'QAS');
    assert.equal(input().contextData.noInquirer, true);
});

test('install import options are prompted only when not passed and prompts are enabled', async () => {
    const input = mockAction('install', { manifest: { name: 'demo', version: '1.0.0' } });
    const run = async argv => {
        const { command, values } = parse(commands.Install, 'install', ['demo', ...argv]);
        await command.run(values, { registry, systemPackages });
        const { import: imp, installDevclass } = input().installData;
        return [imp.noLang, imp.noCust, installDevclass.skipNamespace];
    };
    for (const name of ['install', 'update', 'clean-install', 'import']) {
        const argv = [name === 'import' ? path.join(tempDir, 'local') : 'demo'];
        if (name === 'clean-install') {
            const lockfile = path.join(tempDir, 'prompt-lock.json');
            fs.writeFileSync(lockfile, JSON.stringify({ lockfileVersion: 1, source: 'DEV', packages: [] }));
            argv.push('--lock-file', lockfile);
        }
        if (name === 'import') fs.writeFileSync(path.join(tempDir, 'local.trm'), 'artifact');
        const { command, values } = parse(commands.Install, name, argv);
        await command.run(values, { registry, systemPackages });
        const { import: imp, installDevclass } = input().installData;
        assert.deepEqual([imp.noLang, imp.noCust, installDevclass.skipNamespace], [undefined, undefined, undefined], name);
    }
    assert.deepEqual(await run(['--no-lang-tr', '--no-cust-tr', '--namespace']), [true, true, false]);
    assert.deepEqual(await run(['--no-prompts']), [false, false, true]);
    // explicit answers without prompting
    assert.deepEqual(await run(['--lang-tr', '--cust-tr', '--no-namespace']), [false, false, true]);
    assert.deepEqual(await run(['--lang-tr']), [false, undefined, undefined]);
    assert.deepEqual(await run(['--no-prompts', '--no-namespace']), [false, false, true]);
    assert.deepEqual(await run(['--no-prompts', '--no-lang-tr', '--no-cust-tr', '--namespace']), [true, true, false]);
    // programmatic run (no Commander parsing): values are explicit, metadata defaults apply
    const programmatic = new commands.Install('install');
    await programmatic.run({ package: 'demo' }, { registry, systemPackages });
    const { import: imp, installDevclass } = input().installData;
    assert.deepEqual([imp.noLang, imp.noCust, installDevclass.skipNamespace], [false, false, true]);
});

test('publish and pack map manifest engines, changelog and customizing arrays', async () => {
    const input = mockAction('publish', { trmPackage: { manifest: { get: () => ({ name: 'demo', version: '1.0.0' }) } } });
    for (const name of ['publish', 'pack']) {
        const argv = ['demo', '1.0.0'];
        if (name === 'pack') argv.push(path.join(tempDir, 'demo.trm'));
        argv.push('--no-prompts', '--engines', '{"trm":{"trm-core":">=10"}}', '--changelog', 'Changes', '--cust', 'DEVK1,DEVK2', '--no-cust-tr');
        if (name === 'publish') argv.push('--public');
        const { command, values } = parse(commands.Publish, name, argv);
        await command.run(values, { registry, systemPackages });
        assert.deepEqual(input().packageData.manifest.engines, { trm: { 'trm-core': '>=10' } });
        assert.equal(input().publishData.changelog, 'Changes');
        assert.deepEqual(input().publishData.customizingTransports, ['DEVK1', 'DEVK2']);
        assert.equal(input().publishData.noCustomizingTransports, true);
        if (name === 'publish') assert.equal(input().publishData.private, false);
    }
    const { command, values } = parse(commands.Publish, 'publish', ['demo', '--no-prompts', '--public', '--drop-cust', 'DEVK1, DEVK2']);
    await command.run(values, { registry, systemPackages });
    assert.deepEqual(input().publishData.dropCustomizingTransports, ['DEVK1', 'DEVK2']);
    assert.equal(input().publishData.noCustomizingTransports, false);
    assert.ok(!commands.getCommandMetadata('pack').options.some(option => option.flags.includes('--drop-cust')));
});

test('pack keeps package and version arguments when interactive prompts are skipped', async () => {
    const input = mockAction('publish', { trmPackage: { manifest: { get: () => ({ name: 'trm-server', version: '7.0.1' }) } } });
    const originalPrompt = commons.Inquirer.prompt;
    commons.Inquirer.prompt = async questions => {
        assert.ok(questions.every(question => question.when === false));
        return {};
    };

    try {
        const filename = path.join(tempDir, 'trm-server.trm');
        const { command, values } = parse(commands.Publish, 'pack', ['trm-server', '7.0.1', filename]);
        await command.run(values, { systemPackages });
        assert.equal(input().packageData.name, 'trm-server');
        assert.equal(input().packageData.version, '7.0.1');
    } finally {
        commons.Inquirer.prompt = originalPrompt;
    }
});

test('uninstall invokes the new action with validation and landscape options', async () => {
    const input = mockAction('uninstall', { manifest: { name: 'demo', version: '1.0.0' } });
    const { command, values } = parse(commands.Uninstall, 'uninstall', ['demo', '--no-prompts', '--no-dependants', '--ignore-dirty', '--landscape-tr-target', 'QAS']);
    await command.run(values, { registry, systemPackages });
    assert.deepEqual(input(), {
        contextData: { systemPackages, noInquirer: true },
        packageData: { name: 'demo', registry },
        uninstallData: { checks: { noDependants: true, ignoreDirty: true }, landscapeTransport: { targetSystem: 'QAS' } }
    });
    assert.equal(commands.getCommand('uninstall'), commands.Uninstall);
});

test('CG3Z forwards overwrite and prompt settings without R3trans', async () => {
    const input = mockAction('cg3z', { trkorr: 'DEVK1' });
    const filename = path.join(tempDir, 'transport.zip');
    fs.writeFileSync(filename, 'archive');
    core.SystemConnector.getDefaultTransportLayer = async () => 'ZDEV';
    core.SystemConnector.getDest = () => 'DEV';
    const { command, values } = parse(commands.Cg3z, 'cg3z', [filename, '--overwrite', '--no-prompts']);
    await command.run(values);
    assert.equal(input().uploadData.overwrite, true);
    assert.equal(input().contextData.noInquirer, true);
    assert.ok(!('r3transOptions' in input()));
});

test('content reads packed entries and retains all customizing transports', async () => {
    const trees = [], tables = [];
    commons.Logger.tree = value => trees.push(value);
    commons.Logger.table = (header, rows) => tables.push(rows);
    const artifact = { getTransportBinaries: async () => ['DEVK1', 'DEVK2'].map(trkorr => ({
        trkorr, type: 'CUST', entries: { tadir: [{ objName: 'ZTEST' }], e071: [{ objName: 'ZTEST' }], tdevc: [], tdevct: [] }
    })) };
    const registry = { getPackage: async () => ({ manifest: { version: '1.0.0' } }), downloadArtifact: async () => artifact };
    for (const full of [false, true]) {
        await new commands.Content('content').run({ package: 'demo', full }, { registry });
    }
    assert.equal(trees[0].children.length, 2);
    assert.equal(trees[1].children.length, 4);
    assert.deepEqual(tables[0], [['CUST', 'DEVK1, DEVK2']]);
});

test('removed install options are absent for all installation variants', () => {
    for (const name of ['install', 'update', 'clean-install', 'import']) {
        const metadata = commands.getCommandMetadata(name);
        assert.ok(!metadata.requirements.requiresR3trans);
        for (const flag of ['--no-obj-type', '--no-install-tr', '--install-tr-target']) {
            assert.ok(!metadata.options.some(option => option.flags.includes(flag)));
        }
    }
});

test('non-interactive prompt options are hidden from GUI metadata', () => {
    for (const CommandClass of commands.commands) {
        const metadataEntries = Array.isArray(CommandClass.metadata) ? CommandClass.metadata : [CommandClass.metadata];
        for (const metadata of metadataEntries) {
            for (const option of metadata.options.filter(option => option.flags.includes('--no-prompts'))) {
                assert.equal(option.guiRelevant, false, `${metadata.id} exposes ${option.flags} to the GUI`);
            }
        }
    }
});

test('self-update resolves package managers next to the running Node executable', () => {
    const command = new commands.Install('update');
    const expectedName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const sibling = path.join(path.dirname(process.execPath), expectedName);
    const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    const expected = process.platform === 'win32' && fs.existsSync(npmCli)
        ? { bin: process.execPath, args: [npmCli, '--version'] }
        : { bin: fs.existsSync(sibling) ? sibling : expectedName, args: ['--version'] };
    assert.deepEqual(command.resolvePackageManagerCommand('npm', ['--version']), {
        ...expected
    });
});

test('self-update recognizes Windows package-manager shims as batch files', () => {
    const command = new commands.Install('update');
    assert.equal(command.isWindowsBatchFile('C:\\Program Files\\nodejs\\npm.cmd', 'win32'), true);
    assert.equal(command.isWindowsBatchFile('C:\\Program Files\\nodejs\\npm.exe', 'win32'), false);
    assert.equal(command.isWindowsBatchFile('/usr/local/bin/npm.cmd', 'darwin'), false);
});

test('self-update cleans the npm cache before installing globally', async () => {
    const command = new commands.Install('update');
    const calls = [];
    command.resolvePackageManagerCommand = (bin, args) => ({ bin, args });
    command.spawnCommand = async (bin, args) => calls.push([bin, args]);
    const originalUserAgent = process.env.npm_config_user_agent;
    delete process.env.npm_config_user_agent;

    try {
        await command.selfUpdate();
    } finally {
        if (originalUserAgent === undefined) delete process.env.npm_config_user_agent;
        else process.env.npm_config_user_agent = originalUserAgent;
    }

    assert.deepEqual(calls, [
        ['npm', ['cache', 'clean', '--force']],
        ['npm', ['install', '-g', 'trm-client@latest']]
    ]);
});

test.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

test('install of trm-rest is not blocked by an unsatisfied trm-server', () => {
    const blocks = (name, unsatisfied) => {
        const { command } = parse(commands.Install, 'install', ['demo']);
        command.args = { package: name };
        return command.onTrmDepVersionNotSatisfied({ compareName: o => o.trim().toLowerCase() === unsatisfied });
    };
    assert.equal(blocks('trm-server', 'trm-server'), false);
    assert.equal(blocks('trm-rest', 'trm-server'), false);
    assert.equal(blocks('demo', 'trm-server'), true);
    assert.equal(blocks('trm-rest', 'other'), true);
    assert.equal(blocks('TRM-REST ', 'trm-server'), false);
    assert.equal(blocks(undefined, 'trm-server'), true);
});
