import { AlertTriangle, Loader2 } from "lucide-react";

export const LoadingState = () => (
  <main className="state-screen" data-testid="loading-state">
    <div className="state-card">
      <Loader2 className="spinner" size={42} aria-hidden="true" />
      <p data-testid="loading-state-text">Loading live tracker data</p>
    </div>
  </main>
);

export const ErrorState = ({ message, onRetry }) => (
  <main className="state-screen" data-testid="error-state">
    <div className="state-card error-card">
      <AlertTriangle size={42} aria-hidden="true" />
      <h1 data-testid="error-state-heading">Tracker data could not load</h1>
      <p data-testid="error-state-message">{message || "The dashboard could not read the public Google Sheet right now."}</p>
      <button data-testid="retry-load-button" type="button" onClick={onRetry}>Try again</button>
    </div>
  </main>
);