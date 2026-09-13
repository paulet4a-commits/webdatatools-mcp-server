// Tools that crawl a website: crawl_site_markdown, extract_contacts, detect_tech_stack.
import { toArray, toUrlSources, pickDefined } from "./util.js";

export const crawlSiteMarkdown = {
  name: "crawl_site_markdown",
  actor: "webdatatools~website-to-markdown",
  description:
    "Crawl a website starting from one URL and return one Markdown document per page (docs sites, blogs, knowledge bases). " +
    "Billed per page crawled, so keep `maxPages` as low as the task allows.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The page to start crawling from, e.g. https://docs.apify.com/platform." },
      maxPages: {
        type: "integer",
        minimum: 1,
        maximum: 5000,
        default: 50,
        description: "Maximum number of pages to crawl and convert. This is the billed unit — raise only as needed.",
      },
      maxDepth: { type: "integer", minimum: 0, maximum: 10, default: 3, description: "How many links deep to follow from the start URL." },
      sameDomainOnly: { type: "boolean", default: true, description: "Only follow links on the same domain as the start URL." },
      useSitemap: { type: "boolean", default: true, description: "Also seed the crawl from the domain's sitemap.xml." },
      outputFormat: {
        type: "string",
        enum: ["markdown", "text", "both"],
        default: "markdown",
        description: "Content format to return per page.",
      },
    },
    required: ["url"],
  },
  mapInput(args) {
    if (!args.url) throw new Error("`url` is required.");
    return pickDefined({
      startUrls: toUrlSources([args.url]),
      maxPages: args.maxPages,
      maxDepth: args.maxDepth,
      sameDomainOnly: args.sameDomainOnly,
      useSitemap: args.useSitemap,
      outputFormat: args.outputFormat,
    });
  },
};

export const extractContacts = {
  name: "extract_contacts",
  actor: "webdatatools~contact-extractor",
  description:
    "Crawl a website's home/about/contact pages and pull out e-mail addresses, phone numbers and social profile links " +
    "(LinkedIn, X/Twitter, Instagram, Facebook, YouTube, TikTok, GitHub, Telegram, WhatsApp).",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "A single website to crawl, e.g. https://example.com or example.com." },
      urls: {
        type: "array",
        items: { type: "string" },
        description: "Multiple websites to crawl in one call (one result row per site). Overrides `url` when non-empty.",
      },
      maxPagesPerDomain: { type: "integer", minimum: 1, maximum: 1000, default: 30, description: "How many pages to crawl per website." },
      maxDepth: { type: "integer", minimum: 0, maximum: 5, default: 2, description: "How many links deep to follow from the start page." },
      followSubdomains: { type: "boolean", default: false, description: "Also crawl subdomains such as blog.example.com." },
      extractEmails: { type: "boolean", default: true, description: "Collect e-mail addresses." },
      extractPhones: { type: "boolean", default: true, description: "Collect phone numbers (from tel: links only)." },
      extractSocials: { type: "boolean", default: true, description: "Collect social profile links." },
    },
    required: [],
  },
  mapInput(args) {
    const urls = toArray(args.url, args.urls);
    if (urls.length === 0) throw new Error("Provide either `url` or a non-empty `urls` array.");
    return pickDefined({
      startUrls: toUrlSources(urls),
      maxPagesPerDomain: args.maxPagesPerDomain,
      maxDepth: args.maxDepth,
      followSubdomains: args.followSubdomains,
      extractEmails: args.extractEmails,
      extractPhones: args.extractPhones,
      extractSocials: args.extractSocials,
    });
  },
};

export const detectTechStack = {
  name: "detect_tech_stack",
  actor: "webdatatools~tech-stack-detector",
  description:
    "Fingerprint a website's technology stack: CMS, e-commerce platform, analytics, ad pixels, e-mail marketing, chat widgets, " +
    "payment providers, front-end frameworks, cookie consent, CDN/hosting and web server.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "A single website to fingerprint, e.g. https://example.com or example.com." },
      urls: {
        type: "array",
        items: { type: "string" },
        description: "Multiple websites to fingerprint in one call (one result row per site). Overrides `url` when non-empty.",
      },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "cms", "ecommerce", "analytics", "advertising", "emailMarketing",
            "chat", "payments", "frameworks", "cookieConsent", "cdn", "server",
          ],
        },
        description: "Restrict detection to these categories. Leave empty to detect everything.",
      },
      maxPagesPerDomain: { type: "integer", minimum: 1, maximum: 50, default: 3, description: "How many pages to fetch per website." },
      followSubdomains: { type: "boolean", default: false, description: "Also inspect subdomains such as shop.example.com." },
    },
    required: [],
  },
  mapInput(args) {
    const urls = toArray(args.url, args.urls);
    if (urls.length === 0) throw new Error("Provide either `url` or a non-empty `urls` array.");
    return pickDefined({
      startUrls: toUrlSources(urls),
      categories: args.categories,
      maxPagesPerDomain: args.maxPagesPerDomain,
      followSubdomains: args.followSubdomains,
    });
  },
};
