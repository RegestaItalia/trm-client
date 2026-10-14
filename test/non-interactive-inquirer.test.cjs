const { test } = require('node:test');
const assert = require('node:assert/strict');
const commons = require('trm-commons');
const { NonInteractiveInquirer } = commons;
const { GlobalContext } = require('../dist/utils/GlobalContext');
const { connect } = require('../dist/command/prompts/connect');

const base = {
    prompt: async () => { throw new Error('interactive prompt'); },
    setPrefix: () => {},
    removePrefix: () => {},
    getPrefix: () => ''
};

test('non interactive inquirer skips, defaults or fails', async () => {
    const inquirer = new NonInteractiveInquirer(base, 'Hint.');
    assert.deepEqual(await inquirer.prompt([
        { type: 'input', name: 'skipped', message: 'Skipped', when: () => false },
        { type: 'list', name: 'lang', message: 'Logon Language', default: 'EN', when: () => true },
        { type: 'input', name: 'computed', message: 'Computed', default: answers => answers.lang + '1' }
    ]), { lang: 'EN', computed: 'EN1' });
    await assert.rejects(
        inquirer.prompt({ type: 'input', name: 'user', message: 'Logon User', when: () => true }),
        /"Logon User" \(user\) is required when interactive prompts are disabled \(--no-prompts\)\. Hint\./
    );
    assert.equal(inquirer.isUi(), false);
});

test('REST connection without prompts fails on missing login data instead of asking', async () => {
    const rest = new commons.RESTConnect();
    GlobalContext.getInstance = () => ({ getSettings: () => ({}), getConnections: () => [rest] });
    const previous = commons.Inquirer.inquirer;
    commons.Inquirer.inquirer = new NonInteractiveInquirer(base, 'Hint.');
    try {
        const args = { type: 'REST', forwardRfcDest: 'NONE', noSystemAlias: true, endpoint: 'https://sap.example.com', client: '100', passwd: 'secret' };
        await assert.rejects(connect({ ...args }, false), /\(user\) is required/);
        const result = await connect({ ...args, user: 'ci' }, false);
        assert.deepEqual(result.connect.getData(), {
            endpoint: 'https://sap.example.com', rfcdest: 'NONE', client: '100', user: 'CI', passwd: 'secret', lang: 'EN'
        });
    } finally {
        commons.Inquirer.inquirer = previous;
    }
});

test('RFC connection without prompts accepts an explicitly blank optional SAProuter', async () => {
    const rfc = new commons.RFCConnect();
    GlobalContext.getInstance = () => ({ getSettings: () => ({}), getConnections: () => [rfc] });
    const previous = commons.Inquirer.inquirer;
    commons.Inquirer.inquirer = new NonInteractiveInquirer(base, 'Hint.');
    try {
        const result = await connect({
            type: 'RFC',
            noSystemAlias: true,
            ashost: 'sap.example.com',
            sysnr: '00',
            saprouter: '',
            client: '100',
            user: 'ci',
            passwd: 'secret',
            lang: 'EN'
        }, false);
        assert.deepEqual(result.connect.getData(), {
            ashost: 'sap.example.com',
            sysnr: '00',
            client: '100',
            user: 'CI',
            passwd: 'secret',
            lang: 'EN'
        });
    } finally {
        commons.Inquirer.inquirer = previous;
    }
});
