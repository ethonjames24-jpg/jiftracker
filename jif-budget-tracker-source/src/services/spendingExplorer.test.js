import test from "node:test";
import assert from "node:assert/strict";
import {
  buildControlMap,
  evaluateExplorerRelease,
  fetchSpendingExplorerData,
  normalizeEvery100Rows,
  normalizeSpendingRows,
  parseCsv,
} from "./spendingExplorer.js";

const approvedControls = {
  publication_status: "RELEASED",
  release_authorization_status: "AUTHORIZED",
  model_version: "v1.0",
  schema_status: "MODEL_V1_FROZEN_RELEASED",
  frontend_contract_version: "v1.0",
  aia_public_treatment: "SEPARATE_NEGATIVE_OFFSET_APPROVED",
  default_currency: "JMD",
};

test("CSV parsing preserves embedded commas and escaped quotes", () => {
  const rows = parseCsv('record_id,label\r\n"ROW_1","Health, Education"\r\n"ROW_2","Receipts ""checked"""');
  assert.deepEqual(rows, [
    ["record_id", "label"],
    ["ROW_1", "Health, Education"],
    ["ROW_2", 'Receipts "checked"'],
  ]);
});

test("release evaluation fails closed until both human gates pass", () => {
  const pending = evaluateExplorerRelease({
    ...approvedControls,
    publication_status: "DEVELOPMENT",
    release_authorization_status: "NOT_AUTHORIZED",
  });
  assert.equal(pending.authorized, false);
  assert.equal(pending.code, "NOT_RELEASED");
  assert.equal(evaluateExplorerRelease(approvedControls).authorized, true);
});

test("vertical README controls are converted to a key-value map", () => {
  assert.deepEqual(buildControlMap([
    { control_field: "model_version", value: "v1.0" },
    { control_field: "publication_status", value: "RELEASED" },
  ]), { model_version: "v1.0", publication_status: "RELEASED" });
});

test("the loader checks controls first and does not request DS rows before release", async () => {
  const requestedTabs = [];
  const controlsCsv = [
    "control_field,value,notes",
    "publication_status,DEVELOPMENT,",
    "release_authorization_status,NOT_AUTHORIZED,",
    "model_version,v1.0,",
    "schema_status,MODEL_V1_FROZEN_RELEASE_AUTHORIZATION_PENDING,",
    "frontend_contract_version,v1.0,",
    "aia_public_treatment,SEPARATE_NEGATIVE_OFFSET_APPROVED,",
    "default_currency,JMD,",
  ].join("\n");
  const fetchImpl = async (url) => {
    requestedTabs.push(new URL(url).searchParams.get("sheet"));
    return { ok: true, text: async () => controlsCsv };
  };

  const result = await fetchSpendingExplorerData(fetchImpl);
  assert.deepEqual(requestedTabs, ["README_Control"]);
  assert.equal(result.release.authorized, false);
  assert.deepEqual(result.spending, []);
  assert.deepEqual(result.every_100, []);
});

test("Every J$100 normalization retains the signed AIA offset", () => {
  const base = {
    record_id: "DS_E100_11",
    fiscal_year: "2026/27",
    period_label: "FY2026/27",
    measure_type: "APPROVED_BUDGET_NET",
    public_category_id: "CAT_AIA",
    public_category_name: "Appropriations-in-Aid",
    amount_jmd: "-48730045000",
    denominator_amount_jmd: "1441781354000",
    share_pct: "-3.3798",
    per_j100: "-3.3798",
    display_order: "11",
    source_id: "SRC_EOE_2026_27_PASSED",
    source_url: "https://example.com/source.pdf",
    data_status: "RELEASED",
    last_updated: "2026-07-20T15:11:29-05:00",
  };
  const result = normalizeEvery100Rows([
    base,
    {
      ...base,
      record_id: "PRIVATE_DRAFT_E100",
      amount_jmd: "",
      data_status: "MODEL_APPROVED_RELEASE_NOT_AUTHORIZED",
    },
  ]);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].amount_jmd, -48_730_045_000);
  assert.equal(result.rows[0].per_j100, -3.3798);
  assert.deepEqual(result.warnings, []);
});

test("spending normalization excludes unreleased and malformed rows", () => {
  const base = {
    record_id: "DS_SPEND_00001",
    fiscal_year: "2026/27",
    period_label: "FY2026/27",
    period_type: "ANNUAL",
    measure_type: "VOTED_ESTIMATE",
    organisation_id: "ORG_1",
    organisation_name: "Example ministry",
    function_id: "FUNC_1",
    function_name: "Example function",
    programme_id: "PROG_1",
    programme_name: "Example programme",
    economic_id: "ECON_1",
    economic_name: "Example class",
    public_category_id: "CAT_1",
    public_category_name: "Example category",
    recurrent_or_capital: "RECURRENT",
    amount_jmd: "1,250,000",
    share_of_total_pct: "0.01",
    source_id: "SRC_1",
    source_url: "https://example.com/source.pdf",
    data_status: "RELEASED",
    last_updated: "2026-07-20T15:11:29-05:00",
  };
  const result = normalizeSpendingRows([
    base,
    {
      ...base,
      record_id: "PRIVATE_DRAFT_SPENDING",
      amount_jmd: "",
      data_status: "MODEL_APPROVED_RELEASE_NOT_AUTHORIZED",
    },
    { ...base, record_id: "MALFORMED", amount_jmd: "" },
  ]);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].amount_jmd, 1_250_000);
  assert.deepEqual(result.warnings, ["Some spending records could not be displayed because required details were incomplete."]);
});

test("spending normalization retains vote-level Appropriations-in-Aid offsets", () => {
  const result = normalizeSpendingRows([{
    record_id: "DS_SPEND_AIA_1",
    fiscal_year: "2026/27",
    period_label: "FY2026/27",
    period_type: "ANNUAL",
    measure_type: "APPROPRIATIONS_IN_AID",
    organisation_id: "ORG_1",
    organisation_name: "Example ministry",
    function_id: "",
    function_name: "",
    programme_id: "",
    programme_name: "",
    economic_id: "ECON_AIA",
    economic_name: "Appropriations-in-Aid",
    public_category_id: "CAT_AIA",
    public_category_name: "Appropriations-in-Aid (Offset)",
    recurrent_or_capital: "RECURRENT",
    amount_jmd: "-510850000",
    share_of_total_pct: "-0.03543",
    source_id: "SRC_EOE_2026_27_PASSED",
    source_url: "https://example.com/source.pdf",
    data_status: "RELEASED",
    last_updated: "2026-07-20T15:11:29-05:00",
  }]);

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].amount_jmd, -510_850_000);
  assert.equal(result.rows[0].function_id, "");
  assert.deepEqual(result.warnings, []);
});
