// Small shared helpers used when mapping MCP tool arguments to Apify Actor input.

/** Combine a convenience singular field and a batch/plural array field into one array. */
export function toArray(singular, plural) {
  if (Array.isArray(plural) && plural.length > 0) return plural;
  if (singular !== undefined && singular !== null && singular !== "") return [singular];
  return [];
}

/** Turn a list of bare strings into Apify's requestListSources shape: [{ url }]. */
export function toUrlSources(urls) {
  return urls.map((url) => ({ url }));
}

/** Drop undefined values so we don't send `foo: undefined` fields to the Actor. */
export function pickDefined(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}
