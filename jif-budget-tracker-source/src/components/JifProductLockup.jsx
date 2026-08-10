import { COMPACT_MONOGRAM_URL, HORIZONTAL_WORDMARK_URL } from "../config.js";

export const JifProductLockup = ({ productName, tagline, className = "" }) => (
  <span
    className={`jif-product-lockup ${className}`.trim()}
    data-brand-role="endorsed-product-lockup"
    aria-label={`Jamaica In Focus — ${productName}`}
  >
    <span className="jif-product-lockup-parent" aria-hidden="true">
      <img src={HORIZONTAL_WORDMARK_URL} alt="" className="jif-product-lockup-wordmark" />
      <img src={COMPACT_MONOGRAM_URL} alt="" className="jif-product-lockup-monogram" />
    </span>
    <span className="jif-product-lockup-divider" aria-hidden="true" />
    <span className="jif-product-lockup-copy">
      <strong>{productName}</strong>
      {tagline && <small>{tagline}</small>}
    </span>
  </span>
);
