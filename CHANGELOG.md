# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [0.1.0] — 2026-09-13

First public release.

### Added

- Ten MCP tools over the webdatatools Apify Actors: `web_search`, `read_url`, `crawl_site_markdown`,
  `extract_contacts`, `detect_tech_stack`, `company_profile`, `check_email_security`, `validate_emails`,
  `package_health` and `google_search`.
- stdio transport, so the server runs from any MCP client with `npx -y github:paulet4a-commits/webdatatools-mcp-server`.
- Every call runs on the caller's own `APIFY_TOKEN`; the server never ships or proxies credentials.
- Results are trimmed to readable rows rather than raw dataset dumps, to keep agent context small.
- `smithery.yaml` and `glama.json` manifests for directory listings.
- 29 unit tests covering argument validation, formatting and error paths.
