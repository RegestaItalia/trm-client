const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GlobalContext } = require('../dist/utils/GlobalContext');
const { isTelemetryEnabled } = require('../dist/utils/isTelemetryEnabled');

function withSettings(settings, fn) {
    const getInstance = GlobalContext.getInstance;
    GlobalContext.getInstance = () => ({ getSettings: () => settings });
    try {
        return fn();
    } finally {
        GlobalContext.getInstance = getInstance;
    }
}

test('telemetry is disabled unless the user opted in', () => {
    assert.equal(withSettings({}, isTelemetryEnabled), false);
    assert.equal(withSettings({ telemetry: false }, isTelemetryEnabled), false);
    assert.equal(withSettings({ telemetry: 'false' }, isTelemetryEnabled), false);
    assert.equal(withSettings({ telemetry: 'yes' }, isTelemetryEnabled), false);
    assert.equal(withSettings({ telemetry: true }, isTelemetryEnabled), true);
    // set with `trm settings -s telemetry=true` in this process, before the file is read again
    assert.equal(withSettings({ telemetry: 'true' }, isTelemetryEnabled), true);
});

test('telemetry is disabled when settings cannot be read', () => {
    const getInstance = GlobalContext.getInstance;
    GlobalContext.getInstance = () => { throw new Error('no roaming folder'); };
    try {
        assert.equal(isTelemetryEnabled(), false);
    } finally {
        GlobalContext.getInstance = getInstance;
    }
});
