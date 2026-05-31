import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, CircleDot } from "lucide-react";

const statusStyles = {
  "On Track": "border-emerald-700 bg-emerald-100 text-emerald-900",
  Watch: "border-amber-700 bg-amber-100 text-amber-950",
  "Under Pressure": "border-red-700 bg-red-100 text-red-900",
};

const statusIcons = {
  "On Track": CheckCircle2,
  Watch: CircleDot,
  "Under Pressure": AlertTriangle,
};

export const StatusBadge = ({ status = "Not reported", testId }) => {
  const Icon = statusIcons[status] || CircleDot;
  return (
    <Badge
      variant="outline"
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-1 font-bold ${statusStyles[status] || "border-zinc-500 bg-zinc-100 text-zinc-900"}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status || "Not reported"}
    </Badge>
  );
};