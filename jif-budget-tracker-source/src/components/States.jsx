import { AlertTriangle } from "lucide-react";

export const LoadingLine = ({ active = false }) => {
  if (!active) return null;

  return (
    <div className="loading-line" data-testid="loading-line">
      <span className="loading-line-bar" aria-hidden="true" />
      <span className="sr-only" role="status" aria-live="polite">Updating this view</span>
    </div>
  );
};

export const DocumentLoader = ({ label, variant = "tracker" }) => (
  <div className={`document-loader is-${variant}`} data-testid={`${variant}-document-loader`} aria-hidden="true">
    <div className="document-loader-stage">
      <span className="document-loader-sheet is-back" />
      <span className="document-loader-sheet is-middle" />
      <span className="document-loader-sheet is-front">
        <span className="document-loader-heading">
          <img src="/brand/jif-compact-monogram-web-v1.png" alt="" />
          <span />
        </span>
        <span className="document-loader-rule is-wide" />
        <span className="document-loader-rule" />
        <span className="document-loader-rule is-short" />
        <span className="document-loader-scan" />
      </span>
    </div>
    <span className="document-loader-label">{label}</span>
  </div>
);

export const LoadingSkeleton = ({ label = "Loading approved tracker data…", variant = "tracker" }) => (
  <div className={`loading-skeleton-shell is-${variant}`} aria-busy="true" data-testid={`${variant}-loading-skeleton`}>
    <span className="sr-only" role="status" aria-live="polite" data-testid="loading-state-text">{label}</span>
    <div className="loading-skeleton-hero" aria-hidden="true">
      <DocumentLoader label={label} variant={variant} />
      <span className="loading-skeleton-block is-copy" />
      <span className="loading-skeleton-block is-copy-short" />
    </div>
    <div className="loading-skeleton-card-grid" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="loading-skeleton-card" key={index}>
          <span className="loading-skeleton-block is-icon" />
          <span className="loading-skeleton-block is-label" />
          <span className="loading-skeleton-block is-value" />
          <span className="loading-skeleton-block is-note" />
        </div>
      ))}
    </div>
  </div>
);

export const LoadingState = () => (
  <main className="state-screen state-screen-loading" data-testid="loading-state">
    <LoadingLine active />
    <LoadingSkeleton />
  </main>
);

export const ErrorState = ({ message, onRetry }) => (
  <main className="state-screen" data-testid="error-state">
    <div className="state-card error-card">
      <AlertTriangle size={42} aria-hidden="true" />
      <h1 data-testid="error-state-heading">We could not load the tracker right now</h1>
      <p data-testid="error-state-message">{message || "We could not load the tracker right now. Please try again later."}</p>
      <button data-testid="retry-load-button" type="button" onClick={onRetry}>Try again</button>
    </div>
  </main>
);
