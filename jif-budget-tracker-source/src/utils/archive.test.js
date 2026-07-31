import test from "node:test";
import assert from "node:assert/strict";
import { sortArchiveNewestFirst } from "./archive.js";

test("sorts archived tracker months newest-first without mutating the feed", () => {
  const archive = [
    { month_sort: "2026-04", month_label: "April 2026" },
    { month_sort: "2026-06", month_label: "June 2026" },
    { month_sort: "2026-05", month_label: "May 2026" },
  ];

  assert.deepEqual(
    sortArchiveNewestFirst(archive).map((item) => item.month_sort),
    ["2026-06", "2026-05", "2026-04"],
  );
  assert.deepEqual(archive.map((item) => item.month_sort), ["2026-04", "2026-06", "2026-05"]);
});
