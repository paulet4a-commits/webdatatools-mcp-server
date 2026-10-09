import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listToolSummaries, handleCallTool } from "../src/server.js";

describe("missing-token behaviour", () => {
  const originalToken = process.env.APIFY_TOKEN;

  beforeEach(() => {
    delete process.env.APIFY_TOKEN;
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.APIFY_TOKEN;
    else process.env.APIFY_TOKEN = originalToken;
  });

  it("still lists all tools when APIFY_TOKEN is missing, so the client UI doesn't look broken", () => {
    const tools = listToolSummaries();
    expect(tools.length).toBe(11);
    expect(tools.every((t) => typeof t.inputSchema === "object")).toBe(true);
  });

  it("returns a friendly, actionable error from tools/call when APIFY_TOKEN is missing", async () => {
    const result = await handleCallTool({ name: "web_search", arguments: { query: "x" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("APIFY_TOKEN is not set");
    expect(result.content[0].text).toContain("https://console.apify.com/settings/integrations");
  });

  it("checks for a missing token even for a tool whose arguments would otherwise be invalid", async () => {
    // token check happens before schema validation, so the message stays about the token, not the args
    const result = await handleCallTool({ name: "validate_emails", arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("APIFY_TOKEN");
  });

  it("treats a blank/whitespace-only token the same as missing", async () => {
    process.env.APIFY_TOKEN = "   ";
    const result = await handleCallTool({ name: "web_search", arguments: { query: "x" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("APIFY_TOKEN is not set");
  });
});
