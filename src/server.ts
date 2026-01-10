/**
 * @description MCP server with HTTP/SSE and stdio support
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import { TOOLS, get_tool, list_tool_schemas } from "./tools/index.js";

export class MCPServer {
  private readonly _server: Server;

  constructor(private readonly config: IMCP.ServerConfig) {
    this._server = new Server(
      { name: config.name, version: config.version },
      { capabilities: { tools: {} } }
    );
    this._register_handlers();
  }

  private _register_handlers(): void {
    this._server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: list_tool_schemas(),
    }));

    this._server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = get_tool(request.params.name);
      if (!tool) {
        return {
          content: [{ type: "text", text: `Tool not found: ${request.params.name}` }],
          isError: true,
        };
      }
      const result = await tool.handler(request.params.arguments ?? {});
      return {
        content: result.content,
        isError: result.is_error,
      };
    });
  }

  /**
   * @description Start server via stdio transport (for CLI usage)
   */
  async start_stdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this._server.connect(transport);
    console.error(`[MCP] ${this.config.name} v${this.config.version} (stdio)`);
    console.error(`[MCP] Tools: ${TOOLS.map(t => t.name).join(", ")}`);
  }

  /**
   * @description Start HTTP server with SSE transport
   */
  async start_http(port: number): Promise<void> {
    const app = express();
    const transports = new Map<string, SSEServerTransport>();

    app.get("/sse", async (req: Request, res: Response) => {
      const transport = new SSEServerTransport("/messages", res);
      const session_id = crypto.randomUUID();
      transports.set(session_id, transport);

      res.on("close", () => {
        transports.delete(session_id);
        transport.close?.();
      });

      await this._server.connect(transport);
    });

    app.post("/messages", async (req: Request, res: Response) => {
      const session_id = req.query.sessionId as string;
      const transport = transports.get(session_id);
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(404).json({ error: "Session not found" });
      }
    });

    app.get("/health", (_req: Request, res: Response) => {
      res.json({
        status: "ok",
        name: this.config.name,
        version: this.config.version,
        tools: TOOLS.map(t => t.name),
      });
    });

    app.listen(port, () => {
      console.log(`[MCP] ${this.config.name} v${this.config.version}`);
      console.log(`[MCP] HTTP server: http://localhost:${port}`);
      console.log(`[MCP] SSE endpoint: http://localhost:${port}/sse`);
      console.log(`[MCP] Tools: ${TOOLS.map(t => t.name).join(", ")}`);
    });
  }
}
