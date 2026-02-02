#!/usr/bin/env node
/**
 * @description MCP server entry point with modern architecture
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { config } from "./lib/config.js";
import * as schemas from "./schemas.js";
import { audio_handler } from "./tools/audio.js";
import { image_handler } from "./tools/image.js";
import { redesign_handler } from "./tools/redesign.js";

// Parse CLI arguments
function get_arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

const openai_key = get_arg("openai-key");
const openai_url = get_arg("openai-url");
const image_model = get_arg("image-model");
const audio_model = get_arg("audio-model");

if (openai_key) process.env.OPENAI_API_KEY = openai_key;
if (openai_url) process.env.OPENAI_BASE_URL = openai_url;
if (image_model) process.env.OPENAI_IMAGE_MODEL = image_model;
if (audio_model) process.env.OPENAI_AUDIO_MODEL = audio_model;

// Create MCP server
const server = new McpServer({
  name: config.server.name,
  version: config.server.version,
});

// Register tool: audio
server.registerTool(
  "audio",
  {
    description: "Generate speech audio from text using AI text-to-speech. Returns the file path to the generated MP3 audio file.",
    inputSchema: schemas.audio,
  },
  async (input) => {
    try {
      const file_path = await audio_handler(input);
      return {
        content: [{ type: "text" as const, text: file_path }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

// Register tool: image
server.registerTool(
  "image",
  {
    description: "Generate one or more images from a text prompt using AI. Returns an array of file paths to the generated images.",
    inputSchema: schemas.image,
  },
  async (input) => {
    try {
      const pathnames = await image_handler(input);
      return {
        content: [{ type: "text" as const, text: pathnames.join("\n") }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

// Register tool: redesign
server.registerTool(
  "redesign",
  {
    description: "Redesign an existing image based on a text prompt. Reads the source image, converts it to base64, and generates new variations. Returns an array of file paths to the generated images.",
    inputSchema: schemas.redesign,
  },
  async (input) => {
    try {
      const pathnames = await redesign_handler(input);
      return {
        content: [{ type: "text" as const, text: pathnames.join("\n") }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }
);

/**
 * Start server in stdio mode
 */
async function start_stdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`✅ ${config.server.name} v${config.server.version} (stdio)`);
  console.error(`🎯 Tools: audio, image, redesign`);
}

/**
 * Start server in HTTP/SSE mode
 */
async function start_http(port: number): Promise<void> {
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

    await server.connect(transport);
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
      name: config.server.name,
      version: config.server.version,
      tools: ["audio", "image", "redesign"],
    });
  });

  app.listen(port, () => {
    console.log(`✅ ${config.server.name} v${config.server.version}`);
    console.log(`🌐 HTTP server: http://localhost:${port}`);
    console.log(`📡 SSE endpoint: http://localhost:${port}/sse`);
    console.log(`🎯 Tools: audio, image, redesign`);
  });
}

/**
 * Main initialization function
 */
async function main() {
  try {
    console.error(`🚀 Starting ${config.server.name}...`);

    // Validate configuration
    if (!config.openai.api_key) {
      console.error("❌ Error: OPENAI_API_KEY environment variable is required");
      process.exit(1);
    }

    console.error(`🔑 OpenAI API configured`);
    console.error(`🎨 Image model: ${config.openai.image_model}`);
    console.error(`🎤 Audio model: ${config.openai.audio_model}`);

    // Start appropriate transport
    if (process.argv.includes("--stdio")) {
      await start_stdio();
    } else {
      const port = parseInt(get_arg("port") ?? "3100", 10);
      await start_http(port);
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
