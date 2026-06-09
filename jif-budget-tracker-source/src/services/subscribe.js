import { TRACKER_SUBSCRIBE_WEBHOOK_URL } from "../config.js";

const VALID_WEBHOOK_STATUSES = new Set([
  "pending_confirmation",
  "already_subscribed",
  "validation_error",
  "server_error",
]);

const SUBSCRIPTION_SOURCE = "jamaica_in_focus_budget_tracker_public_site";

export const isSubscribeWebhookConfigured = () => Boolean(TRACKER_SUBSCRIBE_WEBHOOK_URL);

const parseWebhookResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return { status: text.trim() };
};

const normaliseWebhookStatus = (payload) => {
  const status = payload?.status || payload?.result || payload?.message || "server_error";
  return VALID_WEBHOOK_STATUSES.has(status) ? status : "server_error";
};

export const submitSubscription = async ({ email, consent }) => {
  if (!isSubscribeWebhookConfigured()) {
    return { status: "configuration_error" };
  }

  if (!email || !consent) {
    return { status: "validation_error" };
  }

  try {
    const response = await fetch(TRACKER_SUBSCRIBE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        consent,
        source: SUBSCRIPTION_SOURCE,
        consent_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return { status: "server_error" };
    }

    const payload = await parseWebhookResponse(response);
    return { status: normaliseWebhookStatus(payload) };
  } catch {
    return { status: "server_error" };
  }
};