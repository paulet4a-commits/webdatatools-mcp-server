import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handleCallTool } from "../src/server.js";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe("dispatch and error mapping (network mocked, no live calls)", () => {
  const originalToken = process.env.APIFY_TOKEN;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.APIFY_TOKEN = "test-token-123";
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.APIFY_TOKEN;
    else process.env.APIFY_TOKEN = originalToken;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects an unknown tool name without touching the network", async () => {
    global.fetch = vi.fn();
    const result = await handleCallTool({ name: "does_not_exist", arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown tool "does_not_exist"');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects invalid arguments (wrong type) before calling the Actor", async () => {
    global.fetch = vi.fn();
    const result = await handleCallTool({ name: "web_search", arguments: { maxResults: "five" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Invalid arguments for web_search/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps a 401 response to a friendly token-check message", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(401, { error: { message: "Token invalid" } }));
    const result = await handleCallTool({ name: "web_search", arguments: { query: "x" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/rejected APIFY_TOKEN/i);
  });

  it("maps a 402 / out-of-credit response to a billing message", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(402, { error: { message: "insufficient credit" } }));
    const result = await handleCallTool({ name: "google_search", arguments: { query: "x" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/enough credit/i);
    expect(result.content[0].text).toContain("console.apify.com/billing");
  });

  it("maps a fetch AbortError to a timeout message", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    });
    const result = await handleCallTool({ name: "package_health", arguments: { package: "react" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/timed out/i);
  });

  it("returns formatted dataset items on a successful run", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, [{ name: "react", latestVersion: "18.3.1" }]));
    const result = await handleCallTool({ name: "package_health", arguments: { package: "npm:react" } });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("1 result.");
    expect(result.content[0].text).toContain("react");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain("acts/webdatatools~package-health-checker/run-sync-get-dataset-items");
    expect(calledUrl).toContain("token=test-token-123");
  });
});
