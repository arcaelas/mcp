/**
 * @description AI-powered background removal tool
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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const cleaner_tool: IMCP.ToolDefinition = {
  name: "bgcleaner",
  description: "Remove background from an image using AI. Produces a high-quality PNG with transparent background, preserving fine details like hair and edges. Returns the folder path containing all processed images.",
  input_schema: {
    type: "object",
    properties: {
      image_path: {
        type: "string",
        description: "Absolute path to the source image file (PNG, JPG, WEBP supported)",
      },
    },
    required: ["image_path"],
  },

  handler: async (args) => {
    const image_path = String(args.image_path);
    const original_name = basename(image_path).replace(/\.[^.]+$/, "");

    try {
      const image_buffer = await readFile(image_path);
      const blob = new Blob([image_buffer]);

      const form_data = new FormData();
      form_data.append("image", blob, basename(image_path));

      const upload_response = await fetch(`${SERVER_URL}/removebg_upload`, {
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

      const output_dir = join(tmpdir(), `bgcleaner-${Date.now()}`);
      await mkdir(output_dir, { recursive: true });

      for (let i = 0; i < 30; i++) {
        await sleep(2000);

        const status_response = await fetch(`${SERVER_URL}/removebg_get_status`, {
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
              const filename = `${original_name}_nobg_${downloaded_files.length}.png`;
              const file_path = join(output_dir, filename);
              await writeFile(file_path, result_buffer);
              downloaded_files.push(filename);
            }
          }

          if (downloaded_files.length > 0) {
            return {
              content: [{
                type: "text",
                text: `${output_dir}\n\nFiles:\n${downloaded_files.join("\n")}`,
              }],
            };
          }
        }
      }

      return {
        content: [{ type: "text", text: "Timeout: processing took too long" }],
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
