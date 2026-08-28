import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../workflows/JIF_SE01_Spending_Explorer_Source_Monitor_INACTIVE.json",
  import.meta.url,
);

test("n8n package is inactive and contains only read-only node types", async () => {
  const workflow = JSON.parse(await readFile(workflowUrl, "utf8"));
  assert.equal(workflow.active, false);
  assert.equal(workflow.meta.packageStatus, "INACTIVE_READ_ONLY");
  assert.equal(workflow.meta.importAuthorized, false);
  assert.equal(workflow.meta.activationAuthorized, false);
  assert.match(workflow.name, /INACTIVE/);

  const allowedNodeTypes = new Set([
    "n8n-nodes-base.manualTrigger",
    "n8n-nodes-base.scheduleTrigger",
    "n8n-nodes-base.code",
    "n8n-nodes-base.httpRequest",
  ]);
  for (const node of workflow.nodes) {
    assert.equal(allowedNodeTypes.has(node.type), true, `unexpected node type: ${node.type}`);
    assert.equal(Object.hasOwn(node, "credentials"), false, `${node.name} must not use credentials`);
    if (node.type === "n8n-nodes-base.httpRequest") {
      assert.equal(node.parameters.method, "GET");
    }
  }
});

test("workflow has one terminal receipt and no downstream side effect", async () => {
  const workflow = JSON.parse(await readFile(workflowUrl, "utf8"));
  assert.equal(Object.hasOwn(workflow.connections, "Return Read-Only Receipt"), false);
  const prohibitedTypes = [
    "n8n-nodes-base.googleSheets",
    "n8n-nodes-base.telegram",
    "n8n-nodes-base.executeWorkflow",
    "n8n-nodes-base.webhook",
    "n8n-nodes-base.writeBinaryFile",
    "n8n-nodes-base.respondToWebhook",
  ];
  assert.equal(workflow.nodes.some((node) => prohibitedTypes.includes(node.type)), false);
});

test("workflow embeds every approved catalog checksum and source URL", async () => {
  const [workflowText, catalogText] = await Promise.all([
    readFile(workflowUrl, "utf8"),
    readFile(new URL("../config/source-catalog.v1.json", import.meta.url), "utf8"),
  ]);
  const catalog = JSON.parse(catalogText);
  for (const source of catalog.artifacts) {
    assert.match(workflowText, new RegExp(source.expectedSha256));
    assert.equal(workflowText.includes(source.url), true);
  }
  assert.equal(workflowText.includes(catalog.discovery.linkInventory.expectedSha256), true);
  assert.equal(workflowText.includes("const discoveryHtml = bytes.toString('utf8')"), true);
});
