# SE-01 Baseline Evidence

Baseline observed: 28 August 2026 UTC  
Authority: Ministry of Finance & Public Service, Jamaica  
Scope: FY2026/27 Central Government Estimates of Expenditure

Final review-fix comparison completed at `2026-08-29T16:50:14.171Z`:
`MONITORED_NO_CHANGE`.
Five sources were checked; five were unchanged; zero changed; zero failed.

Review-fix validation for package v1.0.1 passed 13 of 13 regression tests. The added gates verify
that the local monitor rejects a redirect or final response outside the approved HTTPS host
allowlist, and that the inactive n8n candidate fails closed for missing responses, HTTP failures,
missing status codes and unexpected content types.

Implementation package fingerprints:

- Source catalogue: `f84921812c0950717879b528e57530a4c23f5c8e2bfb65b51b022f6c9b9fda29`
- Inactive n8n workflow export: `fdc9930cacbcffaafc9f552519d31f09b48e5e7d58364a6608d029a02a0bc986`

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
