import { AlertTriangle, CheckCircle2, CircleDot } from "lucide-react";

const styles = {
  "On Track": "status-badge status-green",
  Watch: "status-badge status-amber",
  "Under Pressure": "status-badge status-red",
};

const icons = {
  "On Track": CheckCircle2,
  Watch: CircleDot,
  "Under Pressure": AlertTriangle,
};

const resolveStatus = (status = "") => {
  if (/under pressure/i.test(status)) return "Under Pressure";
  if (/on track/i.test(status)) return "On Track";
  if (/watch/i.test(status)) return "Watch";
  return "";
};

export const StatusBadge = ({ status = "Not reported", testId }) => {
  const resolvedStatus = resolveStatus(status);
  const Icon = icons[resolvedStatus] || CircleDot;
  return (
    <span data-testid={testId} className={styles[resolvedStatus] || "status-badge status-neutral"}>
      <Icon size={15} aria-hidden="true" />
      {status || "Not reported"}
    </span>
  );
};
