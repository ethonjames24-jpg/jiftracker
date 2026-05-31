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

export const StatusBadge = ({ status = "Not reported", testId }) => {
  const Icon = icons[status] || CircleDot;
  return (
    <span data-testid={testId} className={styles[status] || "status-badge status-neutral"}>
      <Icon size={15} aria-hidden="true" />
      {status || "Not reported"}
    </span>
  );
};