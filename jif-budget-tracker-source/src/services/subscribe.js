import { TRACKER_SUBSCRIBE_WEBHOOK_URL } from "../config.js";

const VALID_WEBHOOK_STATUSES = new Set([
  "pending_confirmation",
  "already_subscribed",
  "validation_error",
  "server_error",
]);

const SUBSCRIPTION_SOURCE = "jif_budget_tracker";

export const isSubscribeWebhookConfigured = () => Boolean(TRACKER_SUBSCRIBE_WEBHOOK_URL);

const parseWebhookResponse = async (response) => {
  const responseText = await response.text();
  if (!responseText.trim()) {
    throw new Error("Empty webhook response");
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { status: responseText.trim() };
  }
};

const normaliseWebhookStatus = (payload) => {
  const status = payload?.status || payload?.result || payload?.message || "server_error";
  return VALID_WEBHOOK_STATUSES.has(status) ? status : "server_error";
};

export const submitSubscription = async ({ email, monthSort, consent, company }) => {
  if (!isSubscribeWebhookConfigured()) {
    return { status: "configuration_error" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !consent) {
    return { status: "validation_error" };
  }

  try {
    const response = await fetch(TRACKER_SUBSCRIBE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        email: normalizedEmail,
        source: SUBSCRIPTION_SOURCE,
        month_sort: monthSort || "",
        consent,
        company: company || "",
        page_url: window.location.href,
        submitted_at: new Date().toISOString(),
      }),
    });

    const payload = await parseWebhookResponse(response);
    return { status: normaliseWebhookStatus(payload) };
  } catch {
    return { status: "server_error" };
  }
};