#!/usr/bin/env node
import { main } from "../src/server.js";

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`Fatal error starting webdatatools MCP server: ${err?.message ?? err}`);
  process.exit(1);
});
