const CAPTURE_MODES = new Set(["hero", "kpi", "sources"]);

export const resolveAppView = (search = "") => {
  const params = new URLSearchParams(search);
  const captureMode = params.get("capture")?.toLowerCase() || "";

  if (CAPTURE_MODES.has(captureMode)) return "capture";
  if (params.get("admin")?.toLowerCase() === "checklist") return "admin";
  if (params.get("view")?.toLowerCase() === "spending") return "spending";
  return "monthly";
};

export const isSpendingExplorerRoute = (search = window.location.search) => resolveAppView(search) === "spending";
