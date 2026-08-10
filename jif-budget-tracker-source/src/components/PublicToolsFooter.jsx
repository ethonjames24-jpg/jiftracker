import { MASTER_BADGE_URL } from "../config.js";

export const PublicToolsFooter = ({ sourceHref = "#source-documents" }) => (
  <footer data-testid="site-footer" className="public-tools-footer">
    <div className="public-tools-footer-inner">
      <div className="public-tools-footer-identity">
        <img src={MASTER_BADGE_URL} alt="Jamaica In Focus" data-testid="footer-logo" />
        <div>
          <strong data-testid="footer-brand-text">JIF Budget Tracker</strong>
          <span>Track the numbers. Understand what changed.</span>
        </div>
      </div>

      <nav className="public-tools-footer-links" aria-label="Jamaica In Focus public-finance tools">
        <a href="/">Budget Tracker</a>
        <a href="/?view=spending">Spending Explorer</a>
        <a href={sourceHref}>Official Sources</a>
      </nav>

      <div className="public-tools-footer-meta">
        <span data-testid="footer-live-data-note">Updated from official public-finance sources</span>
        <span data-testid="developer-credit">Built by Crypten Technologies</span>
      </div>
    </div>
  </footer>
);
