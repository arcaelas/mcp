/**
 * @description AI-powered image generation tool
 */

import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MODELS = ["gptimage", "nanobanana", "nanobanana-pro"] as const;
const SIZES = ["512x512", "1024x1024", "1024x1792", "1792x1024"] as const;

export const image_tool: IMCP.ToolDefinition = {
  name: "image",
  description: "Generate an image from a text description. Returns file path.",
  input_schema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image to generate (in English)",
      },
      model: {
        type: "string",
        description: "Model: nanobanana (fast), seedream (realistic), flux (artistic)",
        enum: [...MODELS],
        default: "nanobanana",
      },
      size: {
        type: "string",
        description: "Image dimensions",
        enum: [...SIZES],
        default: "1024x1024",
      },
    },
    required: ["prompt"],
  },

  handler: async (args) => {
    const base_url = process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
    const api_key = process.env.OPENAI_API_KEY;

    if (!api_key) {
      return {
        content: [{ type: "text", text: "Error: OPENAI_API_KEY not configured" }],
        is_error: true,
      };
    }

    try {
      const response = await fetch(`${base_url}/images/generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: args.model ?? "nanobanana",
          prompt: String(args.prompt),
          n: 1,
          size: args.size ?? "1024x1024",
        }),
      });

      if (!response.ok) {
        return {
          content: [{ type: "text", text: `Error ${response.status}: ${await response.text()}` }],
          is_error: true,
        };
      }

      const data = await response.json() as { data?: Array<{ url?: string }> };

      if (!data.data?.[0]?.url) {
        return {
          content: [{ type: "text", text: "Error: No image generated" }],
          is_error: true,
        };
      }

      const base64_match = data.data[0].url.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64_match) {
        return {
          content: [{ type: "text", text: "Error: Invalid response format" }],
          is_error: true,
        };
      }

      const [, format, base64_data] = base64_match;
      const temp_dir = await mkdtemp(join(tmpdir(), "mcp-image-"));
      const file_path = join(temp_dir, `image.${format === "jpeg" ? "jpg" : format}`);
      await writeFile(file_path, Buffer.from(base64_data, "base64"));

      return {
        content: [{ type: "text", text: file_path }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        is_error: true,
      };
    }
  },
};
