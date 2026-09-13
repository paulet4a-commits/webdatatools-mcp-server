# webdatatools MCP server

An MCP (Model Context Protocol) server that gives AI agents — Claude Desktop, Cursor, Cline, ChatGPT desktop, or
any other MCP client — ten web-data tools backed by [WebDataTools' Apify Actors](https://apify.com/webdatatools):
web search, article extraction, site crawling, contact/tech-stack detection, company profiling, e-mail/DNS
security checks, e-mail validation, package health, and raw Google search.

**This server uses *your own* Apify API token.** Every tool call runs an Actor under your Apify account and is
billed to your Apify credit, not ours. Nothing is sent anywhere else.


All of the Actors behind these tools are listed at **[webdatatools](https://paulet4a-commits.github.io/webdatatools/)**.

## Requirements

- Node.js 18+
- A free Apify account and API token: https://console.apify.com/settings/integrations
  (the free plan includes $5/month of platform credit)

## Quick start (no install)

```bash
npx -y github:paulet4a-commits/webdatatools-mcp-server
```

The server speaks MCP over stdio. It reads your token from the `APIFY_TOKEN` environment variable. If
`APIFY_TOKEN` isn't set, the server still starts and lists all ten tools (so it doesn't look broken in a
client's UI) — calling a tool without a token returns a friendly error telling you where to get one.

## Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config) and add:

```json
{
  "mcpServers": {
    "webdatatools": {
      "command": "npx",
      "args": ["-y", "github:paulet4a-commits/webdatatools-mcp-server"],
      "env": {
        "APIFY_TOKEN": "apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

Restart Claude Desktop. The ten tools below appear under the "webdatatools" server.

## Cursor

Cursor → Settings → MCP → Add new MCP server, or edit `.cursor/mcp.json` in your project (or the global
`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "webdatatools": {
      "command": "npx",
      "args": ["-y", "github:paulet4a-commits/webdatatools-mcp-server"],
      "env": {
        "APIFY_TOKEN": "apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## Cline (VS Code extension)

Cline → MCP Servers → Configure MCP Servers, which opens `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "webdatatools": {
      "command": "npx",
      "args": ["-y", "github:paulet4a-commits/webdatatools-mcp-server"],
      "env": {
        "APIFY_TOKEN": "apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      },
      "disabled": false
    }
  }
}
```

Any other MCP client that supports a stdio server with an env map works the same way — set `command` to
`npx`, `args` to `["-y", "github:paulet4a-commits/webdatatools-mcp-server"]`, and pass `APIFY_TOKEN` in `env`.

## Tools

| Tool | Actor | What it does |
|---|---|---|
| `web_search` | [ai-web-search](https://apify.com/webdatatools/ai-web-search) | Search the web (or read specific URLs) and get clean Markdown of the top results |
| `read_url` | [article-extractor](https://apify.com/webdatatools/article-extractor) | Fetch article/blog/news URL(s) and return clean readable Markdown |
| `crawl_site_markdown` | [website-to-markdown](https://apify.com/webdatatools/website-to-markdown) | Crawl a site from a start URL and return one Markdown doc per page (`maxPages` controls cost) |
| `extract_contacts` | [contact-extractor](https://apify.com/webdatatools/contact-extractor) | Pull e-mails, phone numbers and social links off a website |
| `detect_tech_stack` | [tech-stack-detector](https://apify.com/webdatatools/tech-stack-detector) | Fingerprint CMS, e-commerce, analytics, ad pixels, chat, payments, frameworks, CDN |
| `company_profile` | [company-360](https://apify.com/webdatatools/company-360) | One-call company profile: contacts, tech, DNS/e-mail security, TLS grade, hiring, Wikidata facts, SEO |
| `check_email_security` | [dns-email-security-checker](https://apify.com/webdatatools/dns-email-security-checker) | SPF/DMARC/DKIM, mail & DNS provider, registrar, domain age, 0-100 score |
| `validate_emails` | [email-validator](https://apify.com/webdatatools/email-validator) | Syntax + disposable/role detection + live MX/A lookup for a list of e-mails |
| `package_health` | [package-health-checker](https://apify.com/webdatatools/package-health-checker) | npm/PyPI/Crates.io package health: version, downloads, license, GitHub stats |
| `google_search` | [google-search-scraper](https://apify.com/webdatatools/google-search-scraper) | Raw Google SERP data: organic results, People Also Ask, related searches |

Each tool has a precise JSON-Schema `inputSchema` — the calling agent reads the field descriptions to decide
when and how to call it. Most tools accept either a singular convenience field (`url`, `domain`, `email`,
`package`, `query`) or a plural batch array (`urls`, `domains`, `emails`, `packages`, `queries`); the plural
form wins when both are given.

## Pricing

There is no charge for the MCP server itself. Each tool call runs the underlying Actor on **your** Apify
account and is billed at our Apify Store price for that Actor (pay-per-result or pay-per-event, shown on each
Actor's page). Apify's free plan includes **$5 of platform credit per month**, which comfortably covers light
use of these tools. See each Actor's Store page (linked above) for exact pricing, or
https://console.apify.com/billing for your own usage and balance.

## How results are kept small

Tool results are dataset rows from the Actor run, trimmed for readability:

- any text field longer than ~4,000 characters is truncated with a note of how many characters were cut
- the whole response is capped at roughly 100 KB; if it doesn't fit, rows are dropped from the end and the
  reply says how many of the total rows were included vs. omitted

If you need the full untrimmed data, run the Actor directly from the Apify Console or API.

## Configuration reference

| Env var | Required | Description |
|---|---|---|
| `APIFY_TOKEN` | Yes (for tool calls) | Your personal Apify API token. Tool discovery works without it; calling a tool without it returns a friendly error. |

Per-call timeout is 120 seconds. If an Actor run doesn't finish in time, the tool returns a timeout error
suggesting a smaller request (fewer URLs/pages/items).

## Local development

```bash
npm install
npm test          # vitest, all HTTP mocked — no live network or token needed
npm start          # run the server on stdio (needs APIFY_TOKEN in the environment)
```

## Publishing (not yet published — maintainer decision)

Install straight from GitHub — no npm account or publish step needed:

```bash
npx -y github:paulet4a-commits/webdatatools-mcp-server
```

Publishing to npm would only shorten that to `npx -y @webdatatools/mcp-server`; the GitHub form above is
verified working and is what the config examples use.

## Listing on MCP directories

- **Smithery** (https://smithery.ai): the repo already includes `smithery.yaml`. Connect the GitHub repo from
  the Smithery dashboard ("Deploy Server") — nothing else to configure, it reads `smithery.yaml` for the
  stdio start command and the `apifyToken` config field.
- **Glama** (https://glama.ai/mcp/servers): Glama auto-indexes public GitHub repos that ship a valid
  `package.json` with an MCP server `bin` entry and a README with a config example (this repo has both) plus
  `glama.json` declaring the maintainer. Submit the repo URL from https://glama.ai/mcp/servers/new once it's
  pushed to GitHub.
- **mcp.so** (https://mcp.so): submit the GitHub repo URL and/or npm package name via their "Submit" form;
  it scrapes `package.json`, `README.md` and the tool list the same way.

None of the above were created or submitted as part of this task — see the final report for what's left to
do by hand.
