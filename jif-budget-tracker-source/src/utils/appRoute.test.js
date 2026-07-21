import test from "node:test";
import assert from "node:assert/strict";
import { resolveAppView } from "./appRoute.js";

test("existing monthly routes remain the default", () => {
  assert.equal(resolveAppView(""), "monthly");
  assert.equal(resolveAppView("?month=2026-05"), "monthly");
});

test("capture and admin routes take precedence over the Explorer", () => {
  assert.equal(resolveAppView("?view=spending&capture=hero"), "capture");
  assert.equal(resolveAppView("?view=spending&admin=checklist"), "admin");
});

test("the Explorer activates only for the additive spending view", () => {
  assert.equal(resolveAppView("?view=spending"), "spending");
  assert.equal(resolveAppView("?view=SPENDING"), "spending");
  assert.equal(resolveAppView("?view=other"), "monthly");
});
