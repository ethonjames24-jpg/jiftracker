# Website source and methodology disclosure — October 28, 2026

State: [APPROVED] for implementation verification; merge/deployment remain unapproved. Primary route: incremental-impl; supporting frontend-ui-eng and code-review-quality.

Owner approved the website-only plan on October 28. Baseline: main 570a2174fc42c472c775414265f5fc320e6ede0c. Delivery is branch/PR only; merge and deployment require separate approval.

Scope: identify linked-file record dates separately from current-listing dates; disclose April–June workbook variants and retain as-published figures; explain existing overall fallback and supplied-status precedence. All displayed source evidence is pinned to the October 28 reconciliation. Unknown/revised source URLs must not inherit historical notes. Bind financial-impact notes to all eight reviewed KPI rows so later approved feed revisions are not overwritten.

Invariants: no financial values/status recalculation, source URL replacement, feed mutation, Sheets/n8n execution, webhook/config/dependency changes, subscriber sends, receipt replacement, capture changes or Spending Explorer changes. Existing feed metadata remains authoritative. New date labels distinguish record creation from first public availability.

Acceptance: source dates and revision effects follow selected month; May explains already-correct YTD gaps; June explains the materially changed baseline without restating it; methodology documents fallback plus supplied-status precedence without calculating a new status; all eight amounts/statuses and existing links unchanged across April–August; capture rendering unchanged; responsive/keyboard/history checks pass. Run npm test, npm run build, git diff --check and isolated browser checks with blocked external writes. Include reproducible evidence, screenshots and rollback in PR and Drive handoff.

Reconciliation: https://docs.google.com/document/d/1aW8SD0HXgrA5tTBy4ZzgJaua9HAd2EjFl-V8-mJKAsU/edit
The as-published retention approach is approved for this website disclosure. Adopting later financial source versions remains a separate decision.
