#!/usr/bin/env node
/**
 * @description MCP server entry point
 *
 * Usage:
 *   npx @arcaelas/mcp --stdio
 *   npx @arcaelas/mcp --port 8080
 *   npx @arcaelas/mcp --stdio --client-id xxx --openai-key xxx
 */

import { MCPServer } from "./server.js";

function get_arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

const client_id = get_arg("client-id");
const openai_key = get_arg("openai-key");
const openai_url = get_arg("openai-url");

if (client_id) process.env.CLIENT_ID = client_id;
if (openai_key) process.env.OPENAI_API_KEY = openai_key;
if (openai_url) process.env.OPENAI_BASE_URL = openai_url;

const server = new MCPServer({
  name: "arcaelas-mcp",
  version: "1.0.0",
});

if (process.argv.includes("--stdio")) {
  server.start_stdio().catch(console.error);
} else {
  const port = parseInt(get_arg("port") ?? "3100", 10);
  server.start_http(port).catch(console.error);
}
