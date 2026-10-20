# Trusted scanner adapter — required before ARCHIVE mode

No production scanner endpoint, service or credential has yet been configured. No malware scan has been performed during preparation. This contract is an integration requirement, not a scanner implementation.

The native `SE02 | scan` HTTP node sends the **exact original file bytes** as a raw request body, with its canonical PDF/CSV Content-Type and `X-JIF-Expected-SHA256`. It uses a separately selected n8n Header Auth credential and a configured HTTPS endpoint; redirects/retries are disabled. Never send the Drive OAuth credential to the scanner.

The adapter must actually scan the complete request body using its maintained antivirus engine/signatures and calculate its own byte count and SHA-256. It must not echo the claimed header as proof. On a complete clean scan, respond HTTP 200, JSON with exactly these fields:

```json
{
  "status": "CLEAN",
  "sha256": "64 lowercase hexadecimal characters calculated from the body",
  "bytes": 23172267,
  "engine": "actual engine name",
  "engineVersion": "actual engine version",
  "signatureVersion": "actual installed signature version",
  "scannedAt": "ISO-8601 UTC completion timestamp"
}
```

`CLEAN` is accepted only when the byte/hash identity matches, the scan timestamp is no earlier than source retrieval and no later than the workflow clock, and all engine/signature fields are present. Every other result, infected file, incomplete scan, malformed response, HTTP failure or missing adapter blocks ACQUIRED and prevents source upload. JSON responses are capped at 1 MB by the engine after transport.

The scanner must support the reviewed 50,000,000-byte file limit, apply its own bounded transport/body limits, use synchronized clocks, return errors rather than guessing CLEAN, and retain no public copy of the submitted file. Operational acceptance must prove the adapter's real clean/infected/error behavior separately; local fixtures use a simulated scanner and cannot prove antivirus effectiveness.
