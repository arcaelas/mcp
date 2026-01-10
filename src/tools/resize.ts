/**
 * @description AI-powered image upscaling tool
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";

const SERVER_URL = "https://image-upscaling.net";

function get_client_id(): string {
  const client_id = process.env.CLIENT_ID;
  if (!client_id) throw new Error("CLIENT_ID environment variable is required");
  return client_id;
}

const SCALES = [1, 2, 3, 4] as const;
const MODELS = ["diffuser", "plus", "general"] as const;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const resize_tool: IMCP.ToolDefinition = {
  name: "resize",
  description: "Upscale an image using AI without losing quality. Supports 2x, 3x, or 4x scaling with different models optimized for various image sizes. Returns the path to the upscaled image.",
  input_schema: {
    type: "object",
    properties: {
      image_path: {
        type: "string",
        description: "Absolute path to the source image file",
      },
      scale: {
        type: "number",
        description: "Scale factor: 2, 3, or 4 (default: 2)",
        enum: [...SCALES],
        default: 2,
      },
      model: {
        type: "string",
        description: "Model: diffuser (small images, creative), plus (medium/large), general (very large). Default: auto-selected based on image size",
        enum: [...MODELS],
        default: "plus",
      },
      face_enhance: {
        type: "boolean",
        description: "Enhance faces in the image (only for plus/general models)",
        default: false,
      },
    },
    required: ["image_path"],
  },

  handler: async (args) => {
    const image_path = String(args.image_path);
    const scale = Number(args.scale) || 2;
    const model = String(args.model || "plus");
    const face_enhance = Boolean(args.face_enhance);
    const original_name = basename(image_path).replace(/\.[^.]+$/, "");

    try {
      const image_buffer = await readFile(image_path);
      const blob = new Blob([image_buffer]);

      const form_data = new FormData();
      form_data.append("image", blob, basename(image_path));
      form_data.append("scale", String(scale));
      form_data.append("model", model);

      if (face_enhance && (model === "plus" || model === "general")) {
        form_data.append("fx", "");
      }

      if (model === "diffuser") {
        form_data.append("prompt", "");
        form_data.append("creativity", "0.1");
      }

      const upload_response = await fetch(`${SERVER_URL}/upscaling_upload`, {
        method: "POST",
        headers: { "Cookie": `client_id=${get_client_id()}` },
        body: form_data,
      });

      if (!upload_response.ok) {
        return {
          content: [{ type: "text", text: `Upload error: ${upload_response.status}` }],
          is_error: true,
        };
      }

      const output_dir = join(tmpdir(), `resize-${Date.now()}`);
      await mkdir(output_dir, { recursive: true });

      for (let i = 0; i < 60; i++) {
        await sleep(2000);

        const status_response = await fetch(`${SERVER_URL}/upscaling_get_status`, {
          headers: { "Cookie": `client_id=${get_client_id()}` },
        });

        const status = await status_response.json() as {
          pending: string[];
          processing: string[];
          processed: string[];
        };

        const matching_urls = status.processed.filter(url => url.includes(original_name));

        if (matching_urls.length > 0 && !status.processing.some(url => url.includes(original_name))) {
          const downloaded_files: string[] = [];

          for (const url of matching_urls) {
            const download_response = await fetch(`${url}?delete_after_download=`, {
              headers: { "Cookie": `client_id=${get_client_id()}` },
            });

            if (download_response.ok) {
              const result_buffer = Buffer.from(await download_response.arrayBuffer());
              const filename = `${original_name}_${scale}x.png`;
              const file_path = join(output_dir, filename);
              await writeFile(file_path, result_buffer);
              downloaded_files.push(file_path);
            }
          }

          if (downloaded_files.length > 0) {
            return {
              content: [{ type: "text", text: downloaded_files[0] }],
            };
          }
        }
      }

      return {
        content: [{ type: "text", text: "Timeout: upscaling took too long" }],
        is_error: true,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        is_error: true,
      };
    }
  },
};
