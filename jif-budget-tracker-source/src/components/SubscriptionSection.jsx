import { useCallback, useState } from "react";
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

const scrollToSubscribeForm = () => {
  document.getElementById("subscribe")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const MobileSubscribeButton = () => (
  <button type="button" data-testid="mobile-subscribe-scroll-button" className="mobile-subscribe-button" onClick={scrollToSubscribeForm}>
    <Bell size={16} aria-hidden="true" />
    GET MONTHLY UPDATES
  </button>
);

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

export const SubscriptionSection = () => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
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
    const result = await submitSubscription({ email: email.trim(), consent });
    setStatus(result.status);
    if (result.status === "pending_confirmation" || result.status === "already_subscribed") {
      setEmail("");
      setConsent(false);
    }
    setIsSubmitting(false);
  }, [consent, email, validateForm]);

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
            <div><MailCheck size={20} aria-hidden="true" />New monthly update only</div>
            <div><ShieldCheck size={20} aria-hidden="true" />Webhook-only submission</div>
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
            Privacy notice: this form sends your email and consent only to the configured subscription webhook. It does not read subscriber records, does not connect to the private subscriber workbook, and does not store subscriber information in your browser.
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