#!/usr/bin/env node
/**
 * @description MCP server entry point
 *
 * Usage:
 *   npx @arcaelas/mcp               # HTTP on port 3100
 *   npx @arcaelas/mcp --port 8080   # HTTP on custom port
 *   npx @arcaelas/mcp --stdio       # stdio mode for CLI
 */

import { MCPServer } from "./server.js";

const server = new MCPServer({
  name: "arcaelas-mcp",
  version: "1.0.0",
  description: "Servidor MCP modular de Arcaelas",
});

const args = process.argv.slice(2);

if (args.includes("--stdio")) {
  server.start_stdio().catch(console.error);
} else {
  const port_index = args.indexOf("--port");
  const port = port_index !== -1 ? parseInt(args[port_index + 1], 10) : 3100;
  server.start_http(port).catch(console.error);
}
