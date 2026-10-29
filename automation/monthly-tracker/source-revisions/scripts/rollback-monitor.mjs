#!/usr/bin/env node
// Operator-invoked containment only. Never connected to the monitor graph.
import { pathToFileURL } from 'node:url';

export const MONITOR_ID = 'v407uw3UAd050cn0';
const endpoint = `https://n8n.srv1712153.hstgr.cloud/api/v1/workflows/${MONITOR_ID}`;

export async function rollbackMonitor({ apply = false, apiKey = '', request = fetch } = {}) {
  const receipt = { workflow_id: MONITOR_ID, action: 'UNPUBLISH_ONLY', running_executions_checked: false,
    data_restored: false, next: 'Inspect running/waiting executions and reconcile partial writes before any restart.' };
  if (!apply) return { ...receipt, state: 'DRY_RUN', network_requests: 0 };
  if (!apiKey || /[\r\n]/.test(apiKey)) throw new Error('ROLLBACK_API_KEY_REQUIRED');
  async function call(method, suffix = '') {
    let response;
    try {
      response = await request(endpoint + suffix, { method, redirect: 'error',
        headers: { 'X-N8N-API-KEY': apiKey, accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    } catch { throw new Error('ROLLBACK_REQUEST_UNCERTAIN: inspect native state; no automatic retry'); }
    if (!response.ok) throw new Error(`ROLLBACK_HTTP_${response.status}: inspect native state; no automatic retry`);
    let value;
    try { value = await response.json(); } catch { throw new Error('ROLLBACK_RESPONSE_INVALID'); }
    if (value.id !== MONITOR_ID || typeof value.active !== 'boolean') throw new Error('ROLLBACK_IDENTITY_OR_STATE_INVALID');
    return value;
  }
  const before = await call('GET');
  if (before.active) await call('POST', '/deactivate');
  const after = await call('GET');
  if (after.active) throw new Error('ROLLBACK_NOT_CONFIRMED: use native Unpublish and inspect executions');
  return { ...receipt, state: 'INACTIVE_VERIFIED', was_active: before.active };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length === 1 && args[0] !== '--apply')) throw new Error('Usage: node scripts/rollback-monitor.mjs [--apply]');
    console.log(JSON.stringify(await rollbackMonitor({ apply: args[0] === '--apply', apiKey: process.env.JIF_N8N_ROLLBACK_API_KEY }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
