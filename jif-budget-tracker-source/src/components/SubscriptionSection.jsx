import { useCallback, useEffect, useState } from "react";
import { Bell, MailCheck, Send, ShieldCheck } from "lucide-react";
import { isSubscribeWebhookConfigured, submitSubscription } from "../services/subscribe.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const statusMessages = {
  pending_confirmation: "Check your email to confirm your tracker update subscription.",
  already_subscribed: "You are already subscribed to tracker update emails.",
  validation_error: "Please enter a valid email address and confirm your consent.",
  server_error: "We could not submit your request right now. Please try again later.",
  configuration_error: "Subscription form is not configured yet. Add VITE_TRACKER_SUBSCRIBE_WEBHOOK_URL to enable submissions.",
};

const SUBSCRIPTION_STATUS_EVENT = "jif:subscription-status";

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const scrollToSubscribeForm = () => {
  const section = document.getElementById("subscribe");
  const emailInput = document.getElementById("subscriber-email");
  if (!section) return;

  section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  window.setTimeout(() => emailInput?.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 450);
};

export const FloatingSubscribeButton = () => {
  const [hasPassedInvitation, setHasPassedInvitation] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");

  useEffect(() => {
    const invitation = document.querySelector("[data-testid='compact-subscribe-cta-section']");
    const form = document.getElementById("subscribe");
    if (!invitation || !form) return undefined;

    const invitationObserver = new IntersectionObserver(([entry]) => {
      setHasPassedInvitation(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    const formObserver = new IntersectionObserver(([entry]) => setIsFormVisible(entry.isIntersecting), { threshold: 0.12 });

    invitationObserver.observe(invitation);
    formObserver.observe(form);
    return () => {
      invitationObserver.disconnect();
      formObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleStatus = (event) => setSubscriptionStatus(event.detail?.status || "");
    window.addEventListener(SUBSCRIPTION_STATUS_EVENT, handleStatus);
    return () => window.removeEventListener(SUBSCRIPTION_STATUS_EVENT, handleStatus);
  }, []);

  const isComplete = subscriptionStatus === "pending_confirmation" || subscriptionStatus === "already_subscribed";
  const isVisible = hasPassedInvitation && !isFormVisible;
  const label = subscriptionStatus === "pending_confirmation"
    ? "CHECK YOUR EMAIL"
    : isComplete ? "YOU'RE SIGNED UP" : "GET THE NEXT UPDATE";

  return (
    <button
      type="button"
      data-testid="floating-subscribe-scroll-button"
      className={`floating-subscribe-button ${isVisible ? "floating-subscribe-button-visible" : ""} ${isComplete ? "floating-subscribe-button-complete" : ""}`}
      onClick={isComplete ? undefined : scrollToSubscribeForm}
      disabled={isComplete}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      {isComplete ? <MailCheck size={17} aria-hidden="true" /> : <Bell size={17} aria-hidden="true" />}
      {label}
    </button>
  );
};

export const CompactSubscribeCta = () => (
  <section className="compact-subscribe-cta" data-testid="compact-subscribe-cta-section">
    <div>
      <p data-testid="compact-subscribe-eyebrow" className="eyebrow">Monthly alerts</p>
      <h2 data-testid="compact-subscribe-heading">Get the next tracker update by email</h2>
      <p data-testid="compact-subscribe-copy">One email when a new monthly budget update is published.</p>
    </div>
    <button type="button" data-testid="compact-subscribe-scroll-button" onClick={scrollToSubscribeForm}>
      <Bell size={18} aria-hidden="true" />
      GET MONTHLY UPDATES
    </button>
  </section>
);

export const SubscriptionSection = ({ monthSort }) => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    return EMAIL_PATTERN.test(email.trim()) && consent;
  }, [email, consent]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatus("validation_error");
      return;
    }

    setIsSubmitting(true);
    const result = await submitSubscription({ email, monthSort, consent, company });
    setStatus(result.status);
    window.dispatchEvent(new CustomEvent(SUBSCRIPTION_STATUS_EVENT, { detail: { status: result.status } }));
    if (result.status === "pending_confirmation" || result.status === "already_subscribed") {
      setEmail("");
      setConsent(false);
      setCompany("");
    }
    setIsSubmitting(false);
  }, [company, consent, email, monthSort, validateForm]);

  const isConfigured = isSubscribeWebhookConfigured();
  const message = status ? statusMessages[status] : "";

  return (
    <section id="subscribe" className="section-band subscribe-section" data-testid="subscribe-section">
      <div className="subscribe-grid">
        <div className="subscribe-copy-panel">
          <p data-testid="subscribe-eyebrow" className="eyebrow">Budget tracker email alerts</p>
          <h2 data-testid="subscribe-heading">GET THE NEXT MONTHLY TRACKER UPDATE</h2>
          <p data-testid="subscribe-supporting-copy" className="subscribe-supporting-copy">
            Receive one email when a new monthly budget update is published. No daily newsletter. No spam.
          </p>
          <div data-testid="subscribe-privacy-principles" className="subscribe-principles">
            <div><MailCheck size={20} aria-hidden="true" />Monthly updates only</div>
            <div><ShieldCheck size={20} aria-hidden="true" />Unsubscribe anytime</div>
          </div>
        </div>

        <form data-testid="subscribe-form" className="subscribe-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="subscriber-email" data-testid="subscriber-email-label">Email address</label>
          <input
            id="subscriber-email"
            data-testid="subscriber-email-input"
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby="subscribe-privacy-notice subscribe-status-message"
            required
          />

          <label className="honeypot-field" htmlFor="subscriber-company" aria-hidden="true">
            Company
            <input
              id="subscriber-company"
              data-testid="subscriber-company-honeypot"
              type="text"
              name="company"
              value={company}
              tabIndex={-1}
              autoComplete="off"
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>

          <label className="consent-row" data-testid="subscriber-consent-label">
            <input
              data-testid="subscriber-consent-checkbox"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            <span>I agree to receive Jamaica In Focus Budget Tracker update emails.</span>
          </label>

          <button data-testid="subscribe-submit-button" type="submit" disabled={isSubmitting}>
            <Send size={18} aria-hidden="true" />
            {isSubmitting ? "SENDING..." : "NOTIFY ME"}
          </button>

          <p id="subscribe-privacy-notice" data-testid="subscribe-privacy-notice" className="privacy-notice">
            Privacy notice: Your email will be used only to send Jamaica In Focus Budget Tracker updates. We will not sell or share your information, and you can unsubscribe at any time.
          </p>

          {!isConfigured && !message && (
            <p data-testid="subscribe-config-warning" className="subscribe-message warning-message">
              {statusMessages.configuration_error}
            </p>
          )}

          {message && (
            <p id="subscribe-status-message" data-testid="subscribe-status-message" className={`subscribe-message ${status}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};
