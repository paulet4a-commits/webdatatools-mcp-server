import { describe, it, expect } from "vitest";
import { findTool } from "../src/tools/index.js";

describe("argument mapping to Actor input", () => {
  it("maps web_search query + defaults straight through", () => {
    const input = findTool("web_search").mapInput({ query: "best crm", maxResults: 5 });
    expect(input).toEqual({ query: "best crm", maxResults: 5 });
  });

  it("maps read_url singular `url` into the Actor's `urls` array", () => {
    const input = findTool("read_url").mapInput({ url: "https://example.com/post" });
    expect(input).toEqual({ urls: ["https://example.com/post"] });
  });

  it("prefers `urls` batch array over singular `url` when both given", () => {
    const input = findTool("read_url").mapInput({ url: "https://a.com", urls: ["https://b.com", "https://c.com"] });
    expect(input.urls).toEqual(["https://b.com", "https://c.com"]);
  });

  it("throws a clear error when read_url gets neither url nor urls", () => {
    expect(() => findTool("read_url").mapInput({})).toThrow(/Provide either/);
  });

  it("maps crawl_site_markdown url into startUrls request-list shape", () => {
    const input = findTool("crawl_site_markdown").mapInput({ url: "https://docs.apify.com", maxPages: 10 });
    expect(input).toEqual({ startUrls: [{ url: "https://docs.apify.com" }], maxPages: 10 });
  });

  it("maps extract_contacts multiple urls into startUrls for each site", () => {
    const input = findTool("extract_contacts").mapInput({ urls: ["apify.com", "example.com"] });
    expect(input.startUrls).toEqual([{ url: "apify.com" }, { url: "example.com" }]);
  });

  it("maps validate_emails singular `email` into the `emails` array with checkMx default preserved", () => {
    const input = findTool("validate_emails").mapInput({ email: "a@b.com" });
    expect(input).toEqual({ emails: ["a@b.com"] });
  });

  it("maps package_health singular `package` into the `packages` array", () => {
    const input = findTool("package_health").mapInput({ package: "npm:react", enrichGithub: false });
    expect(input).toEqual({ packages: ["npm:react"], enrichGithub: false });
  });

  it("maps company_profile domain into the domains array and passes through toggles", () => {
    const input = findTool("company_profile").mapInput({ domain: "apify.com", includeHiring: false });
    expect(input).toEqual({ domains: ["apify.com"], includeHiring: false });
  });

  it("drops undefined optional fields instead of sending them to the Actor", () => {
    const input = findTool("check_email_security").mapInput({ domain: "apify.com" });
    expect(Object.keys(input)).toEqual(["domains"]);
  });

  it("throws when google_search gets neither query nor queries", () => {
    expect(() => findTool("google_search").mapInput({})).toThrow(/Provide either/);
  });
});
