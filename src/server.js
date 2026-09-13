import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import Ajv from "ajv";

import { TOOLS, findTool } from "./tools/index.js";
import { runActor, getApifyToken, missingTokenMessage, ApifyToolError } from "./apifyClient.js";
import { formatDatasetItems } from "./format.js";

const ajv = new Ajv({ allErrors: true, strict: false });
const validators = new Map(TOOLS.map((tool) => [tool.name, ajv.compile(tool.inputSchema)]));

export const SERVER_INFO = { name: "webdatatools-mcp-server", version: "0.1.0" };

/** List of {name, description, inputSchema} — always available, even with no APIFY_TOKEN set. */
export function listToolSummaries() {
  return TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

function errorResult(message) {
  return { content: [{ type: "text", text: message }], isError: true };
}

/**
 * Core dispatch logic for a tools/call request, kept separate from the SDK
 * transport so it can be unit tested directly without stdio.
 * @param {{name: string, arguments?: object}} params
 */
export async function handleCallTool({ name, arguments: args = {} } = {}) {
  const tool = findTool(name);
  if (!tool) {
    return errorResult(`Unknown tool "${name}". Call tools/list to see available tools.`);
  }

  if (!getApifyToken()) {
    return errorResult(missingTokenMessage());
  }

  const validate = validators.get(name);
  if (validate && !validate(args ?? {})) {
    const problems = (validate.errors ?? [])
      .map((e) => `${e.instancePath ? e.instancePath.replace(/^\//, "") : "input"} ${e.message}`)
      .join("; ");
    return errorResult(`Invalid arguments for ${name}: ${problems}`);
  }

  let actorInput;
  try {
    actorInput = tool.mapInput(args ?? {});
  } catch (err) {
    return errorResult(`Could not build the ${name} request: ${err.message}`);
  }

  try {
    const items = await runActor(tool.actor, actorInput);
    const { text } = formatDatasetItems(items);
    return { content: [{ type: "text", text }] };
  } catch (err) {
    if (err instanceof ApifyToolError) return errorResult(err.message);
    return errorResult(`Unexpected error calling ${name}: ${err.message}`);
  }
}

export function createServer() {
  const server = new Server(SERVER_INFO, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listToolSummaries() }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => handleCallTool(request.params));

  return server;
}

export async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
