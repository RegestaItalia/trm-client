const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JsonLogger } = require('../dist/utils/JsonLogger');

function captureFlush(logger, success) {
    const writeSync = fs.writeSync;
    var out = '';
    fs.writeSync = (fd, text) => { assert.equal(fd, 1); out += text; };
    try {
        logger.flush(success);
    } finally {
        fs.writeSync = writeSync;
    }
    return JSON.parse(out);
}

test('JSON logger collects messages and data in a single document', () => {
    const logger = new JsonLogger(false);
    logger.info('\x1b[36mhello\x1b[39m');
    logger.warning('careful');
    logger.error('hidden', true);
    logger.msgty('E', 'sap error');
    logger.registryResponse({ type: 'WARNING', text: 'registry says' });
    logger.loading('ignored');
    logger.setData({ distTags: { latest: '1.0.0', rc: '1.1.0' } });
    assert.deepEqual(captureFlush(logger, true), {
        success: true,
        data: { distTags: { latest: '1.0.0', rc: '1.1.0' } },
        logs: [
            { type: 'info', text: 'hello' },
            { type: 'warning', text: 'careful' },
            { type: 'error', text: 'sap error' },
            { type: 'warning', text: 'registry says' }
        ]
    });
});

test('JSON logger keeps debug messages only in debug mode and captures console.log', () => {
    const logger = new JsonLogger(true);
    const consoleLog = console.log;
    logger.captureConsole();
    console.log('plain %s', 'text');
    logger.error('debug only', true);
    const output = captureFlush(logger, false);
    assert.equal(console.log, consoleLog);
    assert.deepEqual(output, {
        success: false,
        logs: [
            { type: 'log', text: 'plain text' },
            { type: 'error', text: 'debug only' }
        ]
    });
});
