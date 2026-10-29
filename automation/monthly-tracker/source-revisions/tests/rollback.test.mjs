import test from 'node:test';
import assert from 'node:assert/strict';
import { rollbackMonitor, MONITOR_ID } from '../scripts/rollback-monitor.mjs';

function mock(states) {
  const calls = [];
  return { calls, request: async (url, options) => {
    calls.push({ url, ...options });
    const state = states.shift();
    if (state instanceof Error) throw state;
    return { ok: !state.status, status: state.status || 200, json: async () => state };
  } };
}
test('dry run is offline and missing credentials cannot mutate', async () => {
  const m = mock([]);
  assert.equal((await rollbackMonitor({ request: m.request })).state, 'DRY_RUN');
  await assert.rejects(rollbackMonitor({ apply: true, request: m.request }), /KEY_REQUIRED/);
  assert.equal(m.calls.length, 0);
});
test('active monitor alone is deactivated and independently read back', async () => {
  const m = mock([true, false, false].map(active => ({ id: MONITOR_ID, active })));
  const r = await rollbackMonitor({ apply: true, apiKey: 'test-only', request: m.request });
  assert.equal(r.state, 'INACTIVE_VERIFIED');
  assert.equal(r.running_executions_checked, false);
  assert.deepEqual(m.calls.map(c => c.method), ['GET', 'POST', 'GET']);
  assert.ok(m.calls.every(c => c.url.startsWith(`https://n8n.srv1712153.hstgr.cloud/api/v1/workflows/${MONITOR_ID}`) && c.redirect === 'error'));
  assert.equal(m.calls[1].url.endsWith('/deactivate'), true);
});
test('already inactive monitor is never mutated', async () => {
  const m = mock([false, false].map(active => ({ id: MONITOR_ID, active })));
  await rollbackMonitor({ apply: true, apiKey: 'test-only', request: m.request });
  assert.deepEqual(m.calls.map(c => c.method), ['GET', 'GET']);
});
test('wrong identity and unknown state fail before mutation', async () => {
  for (const state of [{ id: 'another-workflow', active: true }, { id: MONITOR_ID }]) {
    const m = mock([state]);
    await assert.rejects(rollbackMonitor({ apply: true, apiKey: 'test-only', request: m.request }), /IDENTITY_OR_STATE/);
    assert.equal(m.calls.length, 1);
  }
});
test('uncertain writes and denied permission stop without retry or secret disclosure', async () => {
  for (const failure of [new Error('sensitive-test-key'), { status: 403 }]) {
    const m = mock([{ id: MONITOR_ID, active: true }, failure]);
    await assert.rejects(rollbackMonitor({ apply: true, apiKey: 'sensitive-test-key', request: m.request }), error => !error.message.includes('sensitive-test-key'));
    assert.equal(m.calls.length, 2);
  }
});
test('successful POST cannot conceal active readback', async () => {
  const m = mock([true, false, true].map(active => ({ id: MONITOR_ID, active })));
  await assert.rejects(rollbackMonitor({ apply: true, apiKey: 'test-only', request: m.request }), /NOT_CONFIRMED/);
});
