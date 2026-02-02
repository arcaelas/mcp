/**
 * @description AI-powered image redesign using reference images
 */

import { writeFile, readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "../lib/config.js";
import { openai_fetch } from "../lib/client.js";
import { z } from "zod";
import * as schemas from "../schemas.js";

type RedesignInput = z.infer<typeof schemas.redesign>;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Redesign image based on text prompt
 * @param input - Prompt, filename, and count parameters
 * @returns Array of file paths to generated images
 */
export async function redesign_handler(input: RedesignInput): Promise<string[]> {
  const image_buffer = await readFile(input.filename);
  const base64_image = image_buffer.toString("base64");
  const extension = input.filename.split(".").pop()?.toLowerCase() || "png";
  const mime_type =
    extension === "jpg" || extension === "jpeg" ? "image/jpeg" :
    extension === "webp" ? "image/webp" : "image/png";
  const image_url = `data:${mime_type};base64,${base64_image}`;

  const pathnames: string[] = [];

  for (let i = 0; i < input.count; i++) {
    const temp_dir = await mkdtemp(join(tmpdir(), "mcp-redesign-"));
    const file_path = join(temp_dir, `redesign_${i + 1}.png`);

    const response = await openai_fetch("/chat/completions", {
      body: JSON.stringify({
        model: config.openai.image_model,
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: image_url,
              },
            },
            {
              type: "text",
              text: input.prompt,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const error_text = await response.text();
      throw new Error(`API Error ${response.status} on image ${i + 1}/${input.count}: ${error_text}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`No image data received for image ${i + 1}/${input.count}`);
    }

    const base64_match = content.match(/data:image\/(\w+);base64,([A-Za-z0-9+/=]+)/);
    if (!base64_match) {
      throw new Error(`Invalid image format received for image ${i + 1}/${input.count}`);
    }

    const [, , base64_data] = base64_match;
    await writeFile(file_path, Buffer.from(base64_data, "base64"));
    pathnames.push(file_path);

    if (i < input.count - 1) {
      await sleep(config.generation.throttle_ms);
    }
  }

  return pathnames;
}
