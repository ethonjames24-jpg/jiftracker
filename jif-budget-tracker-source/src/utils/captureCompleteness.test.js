import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("KPI capture renders every supplied indicator, including Capital Expenditure and Interest", async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { KpiCaptureView } = await server.ssrLoadModule("/src/components/CaptureViews.jsx");
    const labels = ["Tax Revenue", "Non-Tax Revenue", "Total Revenue & Grants", "Primary Balance", "Fiscal Balance", "Compensation of Employees", "Capital Expenditure", "Interest"];
    const html = renderToStaticMarkup(createElement(KpiCaptureView, {
      currentMonth: { month_label: "Aug 2026", counts: { kpis_tracked: 8 }, status_headline: "Watch" },
      kpis: labels.map(kpi_label => ({ kpi_label, status: "Watch", read_variance_text: "Below YTD baseline" })),
    }));
    assert.equal((html.match(/data-testid="capture-kpi-readout-\d+"/g) || []).length, 8);
    assert.match(html, /Capital Expenditure/);
    assert.match(html, />Interest</);
  } finally {
    await server.close();
  }
});
