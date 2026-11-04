// Pure transition engine. Native n8n nodes own credentials, binary transport and tables.
export function makeArchive({ hash, now, catalog, catalogDigest }) {
  const DRIVE = 'https://www.googleapis.com/drive/v3/files';
  const META = 'id,name,mimeType,size,parents,appProperties,trashed';
  const VERSION = 'jif-se02-archive-v1';
  const GUARD = 'JIF_SE02_ARCHIVE_GLOBAL';
  const fail = m => { throw new Error('JIF_SE02_BLOCKED: ' + m); };
  const stable = v => Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}' : JSON.stringify(v);
  const digest = v => hash(Buffer.from(stable(v)));
  const validId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{8,200}$/.test(v);
  const validHash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
  const json = r => { if (r.status !== 200) fail('HTTP ' + r.status); if (!Buffer.isBuffer(r.bytes) || r.bytes.length > 1000000) fail('JSON response size differs'); try { return JSON.parse(r.bytes.toString('utf8')); } catch { fail('invalid JSON response'); } };
  const issue = (s, phase, request) => { s.phase = phase; s.request = request; return s; };
  const get = (s, phase, url, route = 'drive') => issue(s, phase, { route, method: 'GET', url });
  const props = (s, kind) => ({ jif_se02_batch: s.batchKey, jif_se02_kind: kind, jif_se02_version: '1' });
  const metaUrl = id => DRIVE + '/' + id + '?fields=' + META + '&supportsAllDrives=true';
  const mediaUrl = id => DRIVE + '/' + id + '?alt=media&supportsAllDrives=true';
  function guarded(s, phase, request) {
    s.pending = { phase, request };
    return issue(s, 'GUARD_BEFORE_WRITE', { route: 'guard_read' });
  }
  function rows(r) {
    if (!Array.isArray(r.rows) || r.rows.some(x => x.error)) fail('native table read failed');
    return r.rows.filter(x => Object.keys(x).length);
  }
  function guard(s, r, idle) {
    s.uncertain = true;
    const all = rows(r);
    if (all.length !== 1) fail('exactly one guard row required');
    const g = all[0];
    if (String(g.id) !== String(s.config.guardRowId) || g.guard_key !== GUARD || g.schema_version !== VERSION) fail('guard identity differs');
    const expected = idle ? { lock_token: 'UNLOCKED', holder_execution_id: 'NONE', holder_workflow_id: 'NONE', acquired_at: 'NONE' } : s.claim;
    for (const [k, v] of Object.entries(expected)) if (g[k] !== v) fail(idle ? 'archive guard is held; do not reset it' : 'current execution guard ownership differs');
    s.uncertain = false;
  }
  function scan(report, s, byteCount, retrievedAt = s.retrievedAt) {
    if (!report || report.status !== 'CLEAN' || report.sha256 !== s.observedSha256 || report.bytes !== byteCount || !Number.isFinite(Date.parse(report.scannedAt || '')) || Date.parse(report.scannedAt) > Date.parse(now())) fail('malware scan does not cover the exact bytes');
    for (const field of ['engine', 'engineVersion', 'signatureVersion']) if (typeof report[field] !== 'string' || !report[field].trim() || report[field].length > 200) fail('scanner evidence missing ' + field);
    if (Object.keys(report).sort().join(',') !== ['status', 'sha256', 'bytes', 'engine', 'engineVersion', 'signatureVersion', 'scannedAt'].sort().join(',') || Date.parse(report.scannedAt) < Date.parse(retrievedAt)) fail('scanner evidence fields or timestamp differ');
    return report;
  }
  function sourceBytes(s, bytes, contentType, expectedSize = s.observedBytes) {
    const a = s.source;
    if (!Buffer.isBuffer(bytes) || bytes.length < a.minimumBytes || bytes.length > a.maximumBytes || bytes.length !== expectedSize) fail('source byte size differs');
    const mime = String(contentType || '').toLowerCase().split(';')[0].trim();
    if (!a.expectedContentTypes.includes(mime)) fail('source content type differs');
    if (a.requiredMagicHex && bytes.subarray(0, a.requiredMagicHex.length / 2).toString('hex') !== a.requiredMagicHex) fail('source signature differs');
    if (a.requiredTextTokens?.some(token => !bytes.toString('utf8').includes(token))) fail('source required tokens missing');
    if (hash(bytes) !== s.observedSha256) fail('source changed after monitoring or stored bytes differ');
  }
  function checkMeta(s, f, kind) {
    const folder = kind === 'folder', parent = folder ? s.config.archiveRootId : s.reservation.folderId;
    const expectedId = s.reservation[kind + 'Id'];
    const name = folder ? 'SE02-' + s.batchKey : kind === 'source' ? s.reservation.manifest.file_name : 'source-manifest.json';
    const mime = folder ? 'application/vnd.google-apps.folder' : kind === 'source' ? s.reservation.manifest.mime_type : 'application/json';
    if (f.id !== expectedId || f.name !== name || f.mimeType !== mime || f.trashed || !f.parents?.includes(parent) || stable(f.appProperties) !== stable(props(s, kind))) fail('stored ' + kind + ' metadata differs');
    if (kind === 'source' && Number(f.size) !== s.observedBytes) fail('stored source size differs');
  }
  function validateReservation(s, v) {
    const m = v?.manifest;
    if (v?.version !== VERSION || v.batchKey !== s.batchKey || v.rootId !== s.config.archiveRootId || !validId(v.folderId) || !validId(v.sourceId) || !validId(v.manifestId) || new Set([v.folderId, v.sourceId, v.manifestId]).size !== 3) fail('reservation identity differs');
    if (!m || m.batch_id !== s.batchKey || m.checksum_sha256 !== s.observedSha256 || m.byte_size !== s.observedBytes || m.source_id !== s.source.id || m.fiscal_year !== catalog.fiscalYear || m.publisher !== catalog.authority.publisher || m.source_class !== s.source.sourceClass || m.file_name !== s.source.fileName || m.status !== 'ACQUIRED' || m.release_date !== null || m.release_date_status !== 'NOT_VERIFIED_FOR_CHANGED_BYTES' || !/^\d{4}-\d{2}-\d{2}$/.test(m.catalogue_release_date || '') || m.parser_version !== 'NOT_EXTRACTED' || m.contract_version !== VERSION || m.archive_file_id !== v.sourceId || m.archive_folder_id !== v.folderId || !Number.isFinite(Date.parse(m.retrieved_at || ''))) fail('reservation manifest differs');
    // The original URL/date remains evidence on replays; the current observation cannot rewrite it.
    if (!/^https:\/\/www\.mof\.gov\.jm\/wp-content\/uploads\/[^?#]+$/.test(m.source_url || '') || !validHash(m.catalog_digest) || m.extraction_authorized !== false || m.publication_authorized !== false) fail('reserved source authority or release boundary differs');
    if (m.mime_type !== (s.source.fileName.endsWith('.pdf') ? 'application/pdf' : 'text/csv')) fail('reserved MIME differs');
    scan(m.malware_scan, s, m.byte_size, m.retrieved_at);
    if (digest(m) !== v.manifestSha256) fail('reserved manifest hash differs');
    s.reservation = v;
  }
  function start(config, input, context) {
    const blockers = [];
    if (config.transportEnabled !== true) blockers.push('Native transport nodes are disabled in the import candidate');
    if (!validId(config.archiveRootId)) blockers.push('Dedicated archive root folder not configured');
    if (!validId(config.guardTableId) || !validId(config.ledgerTableId) || config.guardTableId === config.ledgerTableId || !Number.isInteger(config.guardRowId) || config.guardRowId < 1) blockers.push('Isolated SE-02 guard/reservation tables not configured');
    if (!/^https:\/\/[A-Za-z0-9.-]+(?::443)?\/[^?#\s]*$/.test(config.scannerUrl || '')) blockers.push('Trusted malware scanner HTTPS endpoint not configured');
    if (!input) blockers.push('No source-change input supplied');
    const s = { version: VERSION, config, owner: context, phase: 'START', request: {}, writes: 0, officialGets: 0, scannerCalls: 0, reused: false, acquired: false, guardReleased: false };
    if (config.mode === 'REPORT_ONLY') return issue(s, 'REPORT_ONLY', { route: 'done', blockers });
    if (config.mode !== 'ARCHIVE' || blockers.length) fail('archive configuration incomplete: ' + blockers.join('; '));
    if (!/^\d+$/.test(context.executionId || '') || !validId(context.workflowId)) fail('native execution identity required');
    const receipt = input.monitorReceipt;
    const a = catalog.artifacts.find(x => x.id === input.sourceId);
    if (!a || receipt?.workflowId !== 'SE-01' || receipt.catalogDigest !== catalogDigest || receipt.fiscalYear !== catalog.fiscalYear || receipt.state !== 'SOURCE_CHANGE_DETECTED' || receipt.summary?.failed !== 0 || receipt.summary.sourcesChecked !== 5 || !Array.isArray(receipt.results) || receipt.results.length !== 5) fail('complete reviewed-catalogue source-change receipt required');
    const expectedIds = [catalog.discovery.id, ...catalog.artifacts.map(x => x.id)];
    if (new Set(receipt.results.map(x => x.sourceId)).size !== 5 || expectedIds.some(id => !receipt.results.some(x => x.sourceId === id))) fail('monitor source set differs');
    if (receipt.results.some(x => !['UNCHANGED', 'CHANGED'].includes(x.outcome) || x.statusCode !== 200 || !validHash(x.observedSha256))) fail('monitor result validation differs');
    const counts = receipt.results.reduce((v, r) => { v[r.outcome]++; return v; }, { CHANGED: 0, UNCHANGED: 0 });
    if (!counts.CHANGED || counts.CHANGED !== receipt.summary.changed || counts.UNCHANGED !== receipt.summary.unchanged) fail('monitor counts differ');
    const r = receipt.results.find(x => x.sourceId === input.sourceId);
    if (r.url !== a.url || r.sourceClass !== a.sourceClass || r.outcome !== 'CHANGED' || r.expectedSha256 !== a.expectedSha256 || r.observedSha256 === a.expectedSha256 || !Number.isInteger(r.observedBytes) || r.observedBytes < a.minimumBytes || r.observedBytes > a.maximumBytes) fail('selected changed artifact differs');
    const age = Date.parse(now()) - Date.parse(receipt.checkedAt || '');
    if (!Number.isFinite(age) || age < 0 || age > 86400000) fail('monitor receipt is stale or future dated');
    Object.assign(s, { source: a, observedSha256: r.observedSha256, observedBytes: r.observedBytes, monitorCheckedAt: receipt.checkedAt });
    s.batchKey = digest({ publisher: catalog.authority.publisher, source_type: a.id, fiscal_year: catalog.fiscalYear, checksum_sha256: r.observedSha256, parser_version: 'NOT_EXTRACTED', contract_version: VERSION });
    s.claim = { lock_token: 'JIF-SE02|' + context.workflowId + '|' + context.executionId, holder_execution_id: context.executionId, holder_workflow_id: context.workflowId, acquired_at: now() };
    return issue(s, 'GUARD_IDLE', { route: 'guard_read' });
  }
  function ledgerRead(s) { return issue(s, 'LEDGER_READ', { route: 'ledger_read' }); }
  function create(s, kind) {
    if (kind === 'source') {
      s.writes++;
      return guarded(s, 'SOURCE_SESSION_POST', { route: 'drive', method: 'POST', url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id', kind: 'source_session' });
    }
    const q = { route: 'drive', method: 'POST', url: kind === 'folder' ? DRIVE + '?supportsAllDrives=true&fields=id' : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id', kind };
    s.writes++;
    return guarded(s, kind.toUpperCase() + '_POST', q);
  }
  function checkOrCreate(s, kind) { return get(s, kind.toUpperCase() + '_META', metaUrl(s.reservation[kind + 'Id'])); }
  function stepUnsafe(s, r) {
    switch (s.phase) {
      case 'GUARD_IDLE': guard(s, r, true); s.acquireAttempted = true; return issue(s, 'ACQUIRE', { route: 'acquire' });
      case 'ACQUIRE': return issue(s, 'GUARD_HELD', { route: 'guard_read' });
      case 'GUARD_HELD': guard(s, r, false); s.owned = true; return get(s, 'ROOT', DRIVE + '/' + s.config.archiveRootId + '?fields=id,mimeType,trashed,shared&supportsAllDrives=true');
      case 'GUARD_BEFORE_WRITE': { guard(s, r, false); const p = s.pending; delete s.pending; return issue(s, p.phase, p.request); }
      case 'ROOT': { const f = json(r); if (f.id !== s.config.archiveRootId || f.mimeType !== 'application/vnd.google-apps.folder' || f.trashed || f.shared !== false) fail('private archive root required'); return ledgerRead(s); }
      case 'LEDGER_READ': {
        const all = rows(r); if (all.length > 1) fail('duplicate batch reservations');
        if (!all.length) {
          if (s.reservationPending) { s.uncertain = true; fail('reservation write not reconciled; inspect saved execution'); }
          s.officialGets++; return get(s, 'SOURCE_GET', s.source.url, 'public');
        }
        if (all[0].batch_key !== s.batchKey) fail('reservation key differs');
        let v; try { v = JSON.parse(all[0].reservation_json); } catch { fail('invalid stored reservation'); }
        if (s.reservationPending && stable(v) !== stable(s.reservation)) { s.uncertain = true; fail('reservation acknowledgment differs'); }
        validateReservation(s, v); s.reservationPending = false; s.reused = !s.newReservation;
        return checkOrCreate(s, 'folder');
      }
      case 'SOURCE_GET': {
        if (r.status !== 200) fail('official source HTTP ' + r.status);
        sourceBytes(s, r.bytes, r.headers?.['content-type']);
        s.retrievedAt = now(); s.sourceContentType = r.headers['content-type']; s.hasSourceBytes = true; s.scannerCalls++;
        return issue(s, 'SCAN', { route: 'scan', method: 'POST', url: s.config.scannerUrl, kind: 'scan' });
      }
      case 'SCAN': {
        s.scanReport = scan(json(r), s, s.observedBytes);
        if (s.reservation) return create(s, 'source');
        return get(s, 'ALLOCATE_IDS', DRIVE + '/generateIds?count=3&space=drive&type=files');
      }
      case 'ALLOCATE_IDS': {
        const v = json(r); if (v.ids?.length !== 3 || new Set(v.ids).size !== 3 || v.ids.some(x => !validId(x))) fail('Drive ID allocation differs');
        const [folderId, sourceId, manifestId] = v.ids;
        const manifest = { schema_version: '1.0.0', batch_id: s.batchKey, source_id: s.source.id, source_class: s.source.sourceClass, publisher: catalog.authority.publisher, title: s.source.title, fiscal_year: catalog.fiscalYear, release_date: null, release_date_status: 'NOT_VERIFIED_FOR_CHANGED_BYTES', catalogue_release_date: s.source.releaseDate, retrieved_at: s.retrievedAt, source_url: s.source.url, file_name: s.source.fileName, checksum_sha256: s.observedSha256, mime_type: s.source.fileName.endsWith('.pdf') ? 'application/pdf' : 'text/csv', source_content_type: s.sourceContentType, byte_size: s.observedBytes, status: 'ACQUIRED', parser_version: 'NOT_EXTRACTED', contract_version: VERSION, catalog_digest: catalogDigest, monitor_checked_at: s.monitorCheckedAt, malware_scan: s.scanReport, archive_folder_id: folderId, archive_file_id: sourceId, extraction_authorized: false, publication_authorized: false };
        s.reservation = { version: VERSION, rootId: s.config.archiveRootId, batchKey: s.batchKey, folderId, sourceId, manifestId, manifest, manifestSha256: digest(manifest) };
        s.newReservation = true; s.reservationPending = true;
        return guarded(s, 'LEDGER_INSERT', { route: 'ledger_insert' });
      }
      // No second INSERT after an uncertain acknowledgment: read the complete batch key.
      case 'LEDGER_INSERT': return ledgerRead(s);
      case 'FOLDER_META':
        if (r.status === 404) { if (s.justPosted === 'folder') fail('folder create not visible; inspect before resuming'); return create(s, 'folder'); }
        checkMeta(s, json(r), 'folder'); delete s.justPosted; return checkOrCreate(s, 'source');
      case 'FOLDER_POST': s.justPosted = 'folder'; return checkOrCreate(s, 'folder');
      case 'SOURCE_META':
        if (r.status === 404) {
          if (s.justPosted === 'source') fail('source upload not visible; inspect before resuming');
          if (s.hasSourceBytes) return create(s, 'source');
          s.officialGets++; return get(s, 'SOURCE_GET', s.source.url, 'public');
        }
        checkMeta(s, json(r), 'source'); delete s.justPosted; return get(s, 'SOURCE_READBACK', mediaUrl(s.reservation.sourceId));
      case 'SOURCE_POST': s.justPosted = 'source'; return checkOrCreate(s, 'source');
      case 'SOURCE_SESSION_POST': {
        // Session creation does not prove file persistence. An unknown response is not retried.
        if (r.status !== 200) fail('resumable session not acknowledged; inspect before resuming');
        const location = r.headers?.location;
        if (typeof location !== 'string' || !/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?[^\s#]*upload_id=[A-Za-z0-9_%.-]+[^\s#]*$/.test(location)) fail('resumable session location differs');
        s.uploadPuts = (s.uploadPuts || 0) + 1;
        return guarded(s, 'SOURCE_POST', { route: 'drive', method: 'PUT', url: location, kind: 'source' });
      }
      case 'SOURCE_READBACK':
        if (r.status !== 200) fail('source readback HTTP ' + r.status);
        sourceBytes(s, r.bytes, s.reservation.manifest.mime_type); s.sourceReadback = true; s.hasSourceBytes = false;
        return checkOrCreate(s, 'manifest');
      case 'MANIFEST_META':
        if (r.status === 404) { if (s.justPosted === 'manifest') fail('manifest upload not visible; inspect before resuming'); return create(s, 'manifest'); }
        checkMeta(s, json(r), 'manifest'); delete s.justPosted; return get(s, 'MANIFEST_READBACK', mediaUrl(s.reservation.manifestId));
      case 'MANIFEST_POST': s.justPosted = 'manifest'; return checkOrCreate(s, 'manifest');
      case 'MANIFEST_READBACK':
        if (r.status !== 200 || hash(r.bytes) !== s.reservation.manifestSha256 || r.bytes.toString('utf8') !== stable(s.reservation.manifest)) fail('manifest byte readback differs');
        s.acquired = s.sourceReadback === true;
        return issue(s, 'RELEASE', { route: 'release' });
      case 'RELEASE': return issue(s, 'GUARD_RELEASED', { route: 'guard_read' });
      case 'GUARD_RELEASED': guard(s, r, true); s.owned = false; s.guardReleased = true; return issue(s, 'COMPLETE', { route: 'done' });
      default: fail('unknown phase ' + s.phase);
    }
  }
  function step(s, r) {
    if (s?.version !== VERSION) fail('state version differs');
    try { return stepUnsafe(s, r); }
    catch (e) {
      s.failure = String(e.message); s.acquired = false;
      if (s.owned && !s.uncertain && !s.reservationPending && !['RELEASE', 'GUARD_RELEASED'].includes(s.phase)) return issue(s, 'RELEASE', { route: 'release' });
      return issue(s, 'BLOCKED', { route: 'done' });
    }
  }
  function body(s, bytes = Buffer.alloc(0)) {
    const q = s.request;
    if (q.kind === 'scan') { if (hash(bytes) !== s.observedSha256) fail('scanner input bytes differ'); return { bytes, mime: s.source.fileName.endsWith('.pdf') ? 'application/pdf' : 'text/csv' }; }
    if (!q.kind) return { bytes: Buffer.alloc(0), mime: 'application/octet-stream' };
    const kind = q.kind, v = s.reservation;
    if (kind === 'source' && (!s.hasSourceBytes || hash(bytes) !== s.observedSha256)) fail('source upload binary unavailable or differs');
    if (kind === 'source') return { bytes, mime: v.manifest.mime_type };
    const actualKind = kind === 'source_session' ? 'source' : kind;
    const metadata = { id: v[actualKind + 'Id'], name: actualKind === 'folder' ? 'SE02-' + s.batchKey : actualKind === 'source' ? v.manifest.file_name : 'source-manifest.json', mimeType: actualKind === 'folder' ? 'application/vnd.google-apps.folder' : actualKind === 'source' ? v.manifest.mime_type : 'application/json', parents: [actualKind === 'folder' ? s.config.archiveRootId : v.folderId], appProperties: props(s, actualKind) };
    if (kind === 'folder' || kind === 'source_session') return { bytes: Buffer.from(JSON.stringify(metadata)), mime: 'application/json' };
    const data = Buffer.from(stable(v.manifest));
    const boundary = 'JIFSE02' + s.batchKey.slice(0, 24);
    return { bytes: Buffer.concat([Buffer.from('--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + '\r\n--' + boundary + '\r\nContent-Type: ' + metadata.mimeType + '\r\n\r\n'), data, Buffer.from('\r\n--' + boundary + '--\r\n')]), mime: 'multipart/related; boundary=' + boundary };
  }
  function result(s) {
    if (s.request.route !== 'done') fail('terminal state required');
    const ok = s.acquired && s.guardReleased && !s.failure;
    return { ok, workflow_id: s.owner.workflowId, execution_id: s.owner.executionId, scope: 'SPENDING_EXPLORER_SOURCE_ARCHIVE_ONLY', mode: s.config.mode, state: s.phase === 'REPORT_ONLY' ? 'REPORT_ONLY' : ok ? 'ACQUIRED' : 'FAILED_CLOSED', blockers: s.request.blockers || (s.failure ? [s.failure] : []), batch_id: s.batchKey || '', official_download_calls: s.officialGets, scanner_calls: s.scannerCalls, drive_create_attempts: s.writes, source_upload_put_attempts: s.uploadPuts || 0, idempotent_replay: s.reused, guard_release_verified: s.guardReleased, guard_recovery_required: !s.guardReleased && !!s.acquireAttempted, source_byte_readback: ok ? 'PASS' : 'NOT_VERIFIED', manifest_byte_readback: ok ? 'PASS' : 'NOT_VERIFIED', malware_scan_verified: ok, source_package: ok ? { folder_id: s.reservation.folderId, folder_url: 'https://drive.google.com/drive/folders/' + s.reservation.folderId, source_file_id: s.reservation.sourceId, manifest_file_id: s.reservation.manifestId, manifest_sha256: s.reservation.manifestSha256, manifest: s.reservation.manifest } : null, extraction_authorized: false, publication_authorized: false, public_rows_written: 0, subscriber_sends: 0, downstream_calls: 0 };
  }
  return { start, step, body, result, stable };
}
