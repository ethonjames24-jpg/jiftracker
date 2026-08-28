# SE-01 Baseline Evidence

Baseline observed: 28 August 2026 UTC  
Authority: Ministry of Finance & Public Service, Jamaica  
Scope: FY2026/27 Central Government Estimates of Expenditure

Live comparison completed at `2026-08-28T13:24:18.707Z`: `MONITORED_NO_CHANGE`.
Five sources were checked; five were unchanged; zero changed; zero failed.

Implementation package fingerprints:

- Source catalogue: `749792978f0fbb4284d3c9356447799aa23638c19c47ed04d138ef648f266861`
- Inactive n8n workflow export: `fa03f92fc9c2467e7dac759c60f5765838291fd3c98470a3a05b20d3d27ecf25`

## Discovery page

- URL: `https://www.mof.gov.jm/resources-annual-and-supplementary-estimates/`
- Relevant-link inventory: four in-scope FY2026/27 artifacts
- Inventory SHA-256: `92a6622d95e582f25d60c726ee6c996cdcf364f2efc0acc67103518ca36e24a2`

The inventory hash is based on normalized, sorted, newline-separated URLs. It is intentionally not
the full HTML page hash because unrelated footer, layout or plugin changes are not source releases.

## Artifact fingerprints

| Source | Bytes | SHA-256 |
|---|---:|---|
| As Passed PDF | 23,172,267 | `32ef2cb30c9498d2c8d9d4597fcaadce9823c13a97fe199acec19247664a3bd6` |
| Approved Estimates CSV | 10,891,264 | `cdb6ce99c678feabb3c3c48cf2bcc06d756762a8240c302f82719cabecb4e7ab` |
| As Presented PDF | 30,471,481 | `792ab9cbd822c112f19480b6133f6bdeb2d980a4d72710390c36e720c7ffa7af` |
| As Presented Estimates CSV | 12,262,651 | `d480726d35bb1d694f4f0a48e2fab3038c5968d335dc45b00ab5f51bfb497f1a` |

The official source files were downloaded only to temporary local storage for fingerprinting. The
large source bytes are not committed to the repository. A matching fingerprint means the bytes are
unchanged; it does not independently prove the document's legal or editorial acceptance.

## Baseline limitation

No FY2026/27 supplementary estimate was present in the in-scope link inventory at baseline. A new
matching supplementary link will produce `SOURCE_CHANGE_DETECTED` and require human review.
