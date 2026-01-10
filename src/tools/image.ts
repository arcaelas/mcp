/**
 * @description AI-powered image generation tool
 */

import { writeFile, readFile, mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MAX_DIMENSION = 1024;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_REFERENCE_IMAGES = 2;

function clamp_size(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }
  const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export const image_tool: IMCP.ToolDefinition = {
  name: "image",
  description: "Generate an image from a text description using AI. Optionally provide up to 2 reference images (max 3MB each) for style or content guidance. Output dimensions are clamped to 1024px max. Returns file path.",
  input_schema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image to generate (in English)",
      },
      width: {
        type: "number",
        description: "Output image width in pixels (max 1024, will be scaled down if larger)",
        default: 1024,
      },
      height: {
        type: "number",
        description: "Output image height in pixels (max 1024, will be scaled down if larger)",
        default: 1024,
      },
      reference_images: {
        type: "array",
        description: "Array of absolute paths to reference images (max 2 images, max 3MB each)",
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

    const { width, height } = clamp_size(
      Number(args.width) || 1024,
      Number(args.height) || 1024
    );

    const reference_paths = Array.isArray(args.reference_images) ? args.reference_images : [];

    if (reference_paths.length > MAX_REFERENCE_IMAGES) {
      return {
        content: [{ type: "text", text: `Error: Maximum ${MAX_REFERENCE_IMAGES} reference images allowed` }],
        is_error: true,
      };
    }

    const reference_images: string[] = [];

    for (const path of reference_paths) {
      const file_stat = await stat(String(path)).catch(() => null);
      if (!file_stat) {
        return {
          content: [{ type: "text", text: `Error: Reference image not found: ${path}` }],
          is_error: true,
        };
      }
      if (file_stat.size > MAX_FILE_SIZE) {
        return {
          content: [{ type: "text", text: `Error: Reference image exceeds 3MB limit: ${path}` }],
          is_error: true,
        };
      }
      const buffer = await readFile(String(path));
      const base64 = buffer.toString("base64");
      const ext = String(path).split(".").pop()?.toLowerCase() ?? "png";
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
      reference_images.push(`data:${mime};base64,${base64}`);
    }

    try {
      const body: Record<string, unknown> = {
        model: "nanobanana",
        prompt: String(args.prompt),
        n: 1,
        size: `${width}x${height}`,
      };

      if (reference_images.length > 0) {
        body.image = reference_images;
      }

      const response = await fetch(`${base_url}/images/generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
