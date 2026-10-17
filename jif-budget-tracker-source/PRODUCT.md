# JIF Budget Tracker product context (draft)

This scoped baseline records the existing product intent from README.md and docs/ENGINEERING_HANDOFF.md; those documents remain authoritative for operations and design.

The public tracker helps readers understand Jamaica’s fiscal performance, compare monthly indicators, and inspect official sources and receipts. Readers should see the latest approved month by default and be able to select prior months, with eight indicators, status counts, monthly context, and the matching receipts pack.

Preserve the existing JIF layout, gold/navy identity, typography, responsive behavior, and accessible controls. This repair changes only the monthly public data read path. It does not introduce a visual redesign or change scoring, figures, receipts design, or approval decisions.

The frontend reads public data. Approval, publication, evidence storage, and notifications belong to the existing workflows. A successful spreadsheet write alone does not prove the public loader can display the month: verify the same anonymous feed consumed by the site, including month selection and receipts joins.
