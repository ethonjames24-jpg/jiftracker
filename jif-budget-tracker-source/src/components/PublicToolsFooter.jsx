import { LOGO_URL } from "../config.js";

export const PublicToolsFooter = ({ sourceHref = "#source-documents" }) => (
  <footer data-testid="site-footer" className="public-tools-footer">
    <div className="public-tools-footer-inner">
      <div className="public-tools-footer-identity">
        <img src={LOGO_URL} alt="Jamaica In Focus logo" data-testid="footer-logo" />
        <div>
          <strong data-testid="footer-brand-text">Jamaica In Focus</strong>
          <span>Receipts checked. Public finance tracked.</span>
        </div>
      </div>

      <nav className="public-tools-footer-links" aria-label="Jamaica In Focus public-finance tools">
        <a href="/">Budget Tracker</a>
        <a href="/?view=spending">Spending Explorer</a>
        <a href={sourceHref}>Official Sources</a>
      </nav>

      <div className="public-tools-footer-meta">
        <span data-testid="footer-live-data-note">Updated from official public-finance sources</span>
        <span>Built by Crypten Technologies</span>
      </div>
    </div>
  </footer>
);
