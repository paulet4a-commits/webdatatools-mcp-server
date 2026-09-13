// Tools backed by search/read Actors: web_search, read_url, google_search.
import { toArray, pickDefined } from "./util.js";

export const webSearch = {
  name: "web_search",
  actor: "webdatatools~ai-web-search",
  description:
    "Search the web and get back clean Markdown of the top results (or read specific URLs directly, skipping search). " +
    "Good default choice for 'what is X' / 'find info about X' questions. Each result page fetched is a billed row.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "A single search query, e.g. 'best crm for startups'. Ignored if `queries` or `urls` is set.",
      },
      queries: {
        type: "array",
        items: { type: "string" },
        description: "Multiple search queries to run in one call. Overrides `query` when non-empty.",
      },
      urls: {
        type: "array",
        items: { type: "string" },
        description: "Specific page URLs to fetch and convert to Markdown directly, skipping the Google search step.",
      },
      maxResults: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        default: 3,
        description: "How many organic results to read per query.",
      },
      outputFormat: {
        type: "string",
        enum: ["markdown", "text", "both"],
        default: "markdown",
        description: "Body format to return for each result.",
      },
      countryCode: { type: "string", default: "us", description: "2-letter country code for localised results (gl)." },
      languageCode: { type: "string", default: "en", description: "2-letter interface language code (hl)." },
      includeSnippetOnly: {
        type: "boolean",
        default: false,
        description: "If true, return only the SERP title/url/snippet without fetching the page (faster, cheaper).",
      },
    },
  },
  mapInput(args) {
    return pickDefined({
      query: args.query,
      queries: args.queries,
      urls: args.urls,
      maxResults: args.maxResults,
      outputFormat: args.outputFormat,
      countryCode: args.countryCode,
      languageCode: args.languageCode,
      includeSnippetOnly: args.includeSnippetOnly,
    });
  },
};

export const readUrl = {
  name: "read_url",
  actor: "webdatatools~article-extractor",
  description:
    "Fetch one or more article/blog/news URLs and return clean, readable article text as Markdown (title, author, date, body). " +
    "Use this instead of web_search when you already have the exact URL to read.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "A single article URL to extract, e.g. https://blog.apify.com/some-post/." },
      urls: {
        type: "array",
        items: { type: "string" },
        description: "Multiple article URLs to extract in one call. Overrides `url` when non-empty.",
      },
      outputFormat: {
        type: "string",
        enum: ["markdown", "text", "html", "all"],
        default: "markdown",
        description: "Which body format(s) to return. Markdown is smallest and best for LLM use.",
      },
      includeImages: {
        type: "boolean",
        default: true,
        description: "Include the main image and image list; turn off for a smaller, text-only result.",
      },
    },
    required: [],
  },
  mapInput(args) {
    const urls = toArray(args.url, args.urls);
    if (urls.length === 0) {
      throw new Error("Provide either `url` or a non-empty `urls` array.");
    }
    return pickDefined({
      urls,
      outputFormat: args.outputFormat,
      includeImages: args.includeImages,
    });
  },
};

export const googleSearch = {
  name: "google_search",
  actor: "webdatatools~google-search-scraper",
  description:
    "Run a raw Google search and get back structured SERP data: organic results, People Also Ask, related searches. " +
    "Use this when you need Google's ranking/position data itself, not just page content (for that, use web_search).",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "A single Google search query, e.g. 'apify web scraping'." },
      queries: {
        type: "array",
        items: { type: "string" },
        description: "Multiple queries to run in one call. Overrides `query` when non-empty.",
      },
      countryCode: { type: "string", default: "us", description: "2-letter country code to localise results (gl)." },
      languageCode: { type: "string", default: "en", description: "2-letter interface language code (hl)." },
      resultsPerPage: { type: "integer", minimum: 10, maximum: 100, default: 10, description: "Results per SERP page." },
      maxPagesPerQuery: { type: "integer", minimum: 1, maximum: 10, default: 1, description: "How many result pages to fetch per query." },
      device: { type: "string", enum: ["desktop", "mobile"], default: "desktop", description: "Device type to emulate." },
      includePeopleAlsoAsk: { type: "boolean", default: true, description: "Include the People Also Ask box." },
      includeRelatedSearches: { type: "boolean", default: true, description: "Include related-search suggestions." },
      safeSearch: { type: "boolean", default: false, description: "Enable Google SafeSearch filtering." },
    },
    required: [],
  },
  mapInput(args) {
    const queries = toArray(args.query, args.queries);
    if (queries.length === 0) {
      throw new Error("Provide either `query` or a non-empty `queries` array.");
    }
    return pickDefined({
      queries,
      countryCode: args.countryCode,
      languageCode: args.languageCode,
      resultsPerPage: args.resultsPerPage,
      maxPagesPerQuery: args.maxPagesPerQuery,
      device: args.device,
      includePeopleAlsoAsk: args.includePeopleAlsoAsk,
      includeRelatedSearches: args.includeRelatedSearches,
      safeSearch: args.safeSearch,
    });
  },
};
