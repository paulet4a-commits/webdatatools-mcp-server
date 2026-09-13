import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import { TOOLS } from "../src/tools/index.js";

const EXPECTED_NAMES = [
  "web_search",
  "read_url",
  "crawl_site_markdown",
  "extract_contacts",
  "detect_tech_stack",
  "company_profile",
  "check_email_security",
  "validate_emails",
  "package_health",
  "google_search",
];

describe("tool schema validity", () => {
  it("exposes exactly the ten expected tools", () => {
    expect(TOOLS.map((t) => t.name).sort()).toEqual([...EXPECTED_NAMES].sort());
  });

  it("gives every tool a non-empty description and an actor slug", () => {
    for (const tool of TOOLS) {
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.actor).toMatch(/^webdatatools~/);
      expect(typeof tool.mapInput).toBe("function");
    }
  });

  it("gives every tool a compilable JSON Schema object type", () => {
    const ajv = new Ajv({ strict: false });
    for (const tool of TOOLS) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.properties).toBeTypeOf("object");
      expect(() => ajv.compile(tool.inputSchema)).not.toThrow();
    }
  });
});
