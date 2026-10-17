import test from "node:test";
import assert from "node:assert/strict";
import { applyRecordedPublicCopy, AUGUST_PUBLIC_COPY as c } from "./publicCopyCorrections.js";
import { editorialHeadlineFor } from "../utils/brandContent.js";

const fixture = () => ({
  current_month: {
    month_sort: c.month, status_headline: "Central Government: Watch",
    counts: { kpis_tracked: 8, on_track: 3, watch: 3, under_pressure: 2 },
    what_changed_headline: c.beforeHeadline, monthly_editorial_headline: c.beforeHeadline,
    what_changed_bullets: c.beforeBullets, monthly_note: c.beforeNote,
    receipts_pack_url: "/receipts-packs/2026-08-jif-receipts-pack.pdf",
  },
  archive: [{ month_sort: c.month, status: "Watch", note: c.beforeNote,
    counts: { kpis_tracked: 8, on_track: 3, watch: 3, under_pressure: 2 } }],
  kpis: [{ kpi_label: "Tax Revenue", monthly_outturn_value: 401477.813709488 }],
});

test("approved August correction reaches the hero, four bullets and short archive without changing source data", () => {
  const source = fixture(), before = structuredClone(source), out = applyRecordedPublicCopy(source);
  assert.equal(editorialHeadlineFor(out.current_month), "August moves to Watch; revenue pressures remain.");
  assert.equal(out.current_month.what_changed_bullets.split("|").length, 4);
  assert.equal(out.archive[0].note, c.archiveNote);
  assert.equal(out.current_month.monthly_note, source.current_month.monthly_note);
  assert.equal(out.current_month.receipts_pack_url, source.current_month.receipts_pack_url);
  assert.equal(out.kpis, source.kpis);
  assert.deepEqual(source, before);
});

test("newly revised August copy is not replaced by the recorded older correction", () => {
  const source = fixture(); source.current_month.what_changed_headline = "New approved revision";
  assert.equal(applyRecordedPublicCopy(source).current_month, source.current_month);
});

test("changed score or detailed copy prevents applying a stale correction", () => {
  for (const mutate of [s => { s.current_month.counts.watch = 2; },
    s => { s.current_month.what_changed_bullets += "|New reviewed fact"; },
    s => { s.current_month.monthly_editorial_headline = "Separate approved headline"; }]) {
    const source = fixture(); mutate(source);
    assert.equal(applyRecordedPublicCopy(source).current_month, source.current_month);
  }
});

test("historical and future selections keep their copy while August archive remains concise", () => {
  for (const month of ["2026-07", "2026-09"]) {
    const source = fixture(); source.current_month.month_sort = month;
    const out = applyRecordedPublicCopy(source);
    assert.equal(out.current_month, source.current_month);
    assert.equal(out.archive[0].note, c.archiveNote);
  }
});

test("a revised archive note is preserved and repeated application is stable", () => {
  const source = fixture(); source.archive[0].note = "A later approved archive revision.";
  const once = applyRecordedPublicCopy(source);
  assert.equal(once.archive[0].note, source.archive[0].note);
  assert.deepEqual(applyRecordedPublicCopy(once), once);
});
