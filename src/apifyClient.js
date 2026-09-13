// Thin wrapper around the Apify "run Actor synchronously and get dataset items" endpoint.
// Always uses the CALLER's own APIFY_TOKEN — never a token belonging to us.

const API_BASE = "https://api.apify.com/v2";
const DEFAULT_TIMEOUT_MS = 120_000;

export class ApifyToolError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.name = "ApifyToolError";
    this.code = code;
  }
}

export function getApifyToken() {
  const token = process.env.APIFY_TOKEN;
  return token && token.trim() ? token.trim() : null;
}

export function missingTokenMessage() {
  return (
    "APIFY_TOKEN is not set. Set APIFY_TOKEN in your MCP client config " +
    "(env: { \"APIFY_TOKEN\": \"...\" }) — get a free token at " +
    "https://console.apify.com/settings/integrations"
  );
}

/**
 * Run an Actor synchronously and return its dataset items as a plain array.
 * @param {string} actorSlug e.g. "webdatatools~ai-web-search"
 * @param {object} input Actor input object
 * @param {{timeoutMs?: number, fetchImpl?: typeof fetch}} [options]
 */
export async function runActor(actorSlug, input, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch } = options;
  const token = getApifyToken();
  if (!token) {
    throw new ApifyToolError(missingTokenMessage(), { code: "MISSING_TOKEN" });
  }

  const url = `${API_BASE}/acts/${actorSlug}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ApifyToolError(
        `The ${actorSlug} run timed out after ${Math.round(timeoutMs / 1000)}s. ` +
          "Try a smaller request (fewer URLs/pages/items) and try again.",
        { code: "TIMEOUT" }
      );
    }
    throw new ApifyToolError(`Network error calling Apify: ${err.message}`, { code: "NETWORK_ERROR" });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new ApifyToolError(await describeHttpError(res, actorSlug), { code: `HTTP_${res.status}` });
  }

  let items;
  try {
    items = await res.json();
  } catch (err) {
    throw new ApifyToolError(`Apify returned an unreadable response for ${actorSlug}: ${err.message}`, {
      code: "BAD_RESPONSE",
    });
  }

  if (!Array.isArray(items)) return items == null ? [] : [items];
  return items;
}

async function describeHttpError(res, actorSlug) {
  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
    // ignore — body unreadable
  }
  let apiMessage = "";
  try {
    apiMessage = JSON.parse(bodyText)?.error?.message ?? "";
  } catch {
    apiMessage = bodyText.slice(0, 300);
  }

  if (res.status === 401) {
    return (
      "Apify rejected APIFY_TOKEN (401 Unauthorized). Check the token at " +
      "https://console.apify.com/settings/integrations"
    );
  }
  if (res.status === 402 || /insufficient|credit|limit exceeded/i.test(apiMessage)) {
    return (
      `Your Apify account doesn't have enough credit to run ${actorSlug} (HTTP ${res.status}). ` +
      "Add credit or wait for the monthly free-plan reset: https://console.apify.com/billing"
    );
  }
  if (res.status === 404) {
    return `Actor ${actorSlug} was not found or isn't accessible with this APIFY_TOKEN (404).`;
  }
  if (res.status === 429) {
    return "Apify rate-limited this request (429 Too Many Requests). Wait a moment and try again.";
  }
  return `The ${actorSlug} run failed with HTTP ${res.status}${apiMessage ? `: ${apiMessage}` : ""}`;
}
