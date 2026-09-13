// Trim Apify dataset items down to something an agent can read comfortably:
// long field values get truncated, and the whole payload is capped near MAX_BYTES.

export const MAX_FIELD_CHARS = 4000;
export const MAX_BYTES = 100_000;

function trimValue(value) {
  if (typeof value === "string" && value.length > MAX_FIELD_CHARS) {
    const omitted = value.length - MAX_FIELD_CHARS;
    return `${value.slice(0, MAX_FIELD_CHARS)}… [truncated, ${omitted} more chars]`;
  }
  if (Array.isArray(value)) return value.map(trimValue);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) out[key] = trimValue(val);
    return out;
  }
  return value;
}

function byteLength(str) {
  return Buffer.byteLength(str, "utf8");
}

/**
 * @param {any[]} items Apify dataset items
 * @param {{maxBytes?: number}} [options]
 * @returns {{text: string, totalRows: number, includedRows: number, truncatedRows: number}}
 */
export function formatDatasetItems(items, options = {}) {
  const { maxBytes = MAX_BYTES } = options;
  const totalRows = items.length;
  const trimmedRows = items.map(trimValue);

  let rows = trimmedRows;
  let json = JSON.stringify(rows, null, 2);

  // Drop rows from the end, shrinking geometrically, until the payload fits.
  while (rows.length > 1 && byteLength(json) > maxBytes) {
    const nextLength = Math.max(1, Math.floor(rows.length * 0.7));
    rows = rows.slice(0, nextLength === rows.length ? nextLength - 1 : nextLength);
    json = JSON.stringify(rows, null, 2);
  }

  // Last resort: even a single row is too big — hard-truncate its JSON text.
  if (rows.length === 1 && byteLength(json) > maxBytes) {
    const budget = Math.max(200, maxBytes - 100);
    json = `${json.slice(0, budget)}\n… [row truncated to stay under the ${Math.round(maxBytes / 1000)}KB response cap]`;
  }

  const includedRows = totalRows === 0 ? 0 : rows.length;
  const truncatedRows = totalRows - includedRows;

  const header =
    totalRows === 0
      ? "0 results."
      : truncatedRows > 0
        ? `Showing ${includedRows} of ${totalRows} results (${truncatedRows} row(s) omitted to stay under the ` +
          `response size cap; long text fields were also trimmed at ${MAX_FIELD_CHARS} characters).`
        : `${totalRows} result${totalRows === 1 ? "" : "s"}.`;

  return { text: `${header}\n\n${json}`, totalRows, includedRows, truncatedRows };
}
