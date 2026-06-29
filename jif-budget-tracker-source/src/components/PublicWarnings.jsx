import { AlertTriangle } from "lucide-react";
import { buildPublicWarnings } from "../utils/dataQuality.js";

export const PublicWarnings = ({ data }) => {
  const warnings = buildPublicWarnings(data);

  if (!warnings.length) return null;

  return (
    <section className="public-warning-panel" data-testid="public-warning-panel" aria-label="Tracker data notices">
      {warnings.map((warning) => (
        <div key={warning.key} className="public-warning-card" data-testid={`public-warning-${warning.key}`} role="status">
          <AlertTriangle size={20} aria-hidden="true" />
          <p>{warning.message}</p>
        </div>
      ))}
    </section>
  );
};
