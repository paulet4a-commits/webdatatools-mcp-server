import { describe, it, expect } from "vitest";
import { formatDatasetItems, MAX_FIELD_CHARS } from "../src/format.js";

describe("result trimming", () => {
  it("reports 0 results without error on an empty dataset", () => {
    const { text, totalRows, includedRows, truncatedRows } = formatDatasetItems([]);
    expect(text).toMatch(/^0 results\./);
    expect(totalRows).toBe(0);
    expect(includedRows).toBe(0);
    expect(truncatedRows).toBe(0);
  });

  it("passes small datasets through untouched with no truncation note", () => {
    const items = [{ a: 1 }, { a: 2 }];
    const { text, truncatedRows } = formatDatasetItems(items);
    expect(truncatedRows).toBe(0);
    expect(text).toMatch(/^2 results\./);
    expect(text).toContain('"a": 1');
  });

  it("truncates a single long string field and notes how many characters were cut", () => {
    const longText = "x".repeat(MAX_FIELD_CHARS + 500);
    const { text } = formatDatasetItems([{ body: longText }]);
    expect(text).toContain("truncated, 500 more chars");
    expect(text.length).toBeLessThan(longText.length);
  });

  it("caps the overall payload near maxBytes and reports the number of omitted rows", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ id: i, body: "y".repeat(300) }));
    const { text, totalRows, includedRows, truncatedRows } = formatDatasetItems(items, { maxBytes: 5_000 });
    expect(totalRows).toBe(500);
    expect(includedRows).toBeLessThan(500);
    expect(truncatedRows).toBe(totalRows - includedRows);
    expect(text).toMatch(/row\(s\) omitted/);
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(6_000);
  });

  it("still returns something for a single row that alone exceeds maxBytes", () => {
    const hugeRow = { body: "z".repeat(10_000) };
    const { text, includedRows, totalRows } = formatDatasetItems([hugeRow], { maxBytes: 2_000 });
    expect(includedRows).toBe(1);
    expect(totalRows).toBe(1);
    expect(text).toContain("truncated to stay under");
    expect(Buffer.byteLength(text, "utf8")).toBeLessThan(2_500);
  });
});
