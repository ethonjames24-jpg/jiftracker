# Primary implementation references

Target runtime: n8n 2.25.7, as recorded in the existing JIF native-operation evidence. This build did not independently query the running version.

Official source inspected for parameter/runtime shapes:
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.25.7/packages/nodes-base/nodes/DataTable/actions/row/upsert.operation.ts
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.25.7/packages/nodes-base/nodes/DataTable/common/selectMany.ts
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.25.7/packages/nodes-base/nodes/DataTable/common/addRow.ts
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.25.7/packages/nodes-base/nodes/Google/Drive/v2/actions/file/upload.operation.ts
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.25.7/packages/nodes-base/nodes/Google/Drive/v2/actions/file/download.operation.ts
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.25.7/packages/nodes-base/nodes/HttpRequest/V3/HttpRequestV3.node.ts

Official docs:
- https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/core-nodes/n8n-nodes-base.datatable/rows.md
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.extractfromfile/
- https://github.com/n8n-io/n8n-docs/blob/main/docs/build/code-in-n8n/cookbook/built-in-methods-and-variables-examples/getworkflowstaticdata.md

The monitor deliberately uses separate Data Tables, not workflow static data: manual test persistence must not depend on a published-trigger execution. It archives raw workbook bytes but does not treat row extraction/cached values as formula reconciliation. Semantic review uses the packaged restricted evaluator. Source inspection and local VM tests are not native execution acceptance.
