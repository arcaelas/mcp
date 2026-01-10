/**
 * @description Text-to-speech audio generation tool
 */

import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VOICES = ["nova", "alloy", "echo", "fable", "onyx", "shimmer", "coral", "sage"] as const;

export const tts_tool: IMCP.ToolDefinition = {
  name: "audio",
  description: "Generate speech audio from text. Returns file path.",
  input_schema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Text to convert to speech",
      },
      voice: {
        type: "string",
        description: "Voice: nova (warm), echo (deep), fable (narrative), onyx (authoritative)",
        enum: [...VOICES],
        default: "nova",
      },
    },
    required: ["text"],
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
      const response = await fetch(`${base_url}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-audio",
          modalities: ["text", "audio"],
          audio: { voice: args.voice ?? "nova", format: "mp3" },
          messages: [{
            role: "user",
            content: `Say exactly: ${args.text}`,
          }],
        }),
      });

      if (!response.ok) {
        return {
          content: [{ type: "text", text: `Error ${response.status}: ${await response.text()}` }],
          is_error: true,
        };
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { audio?: { data?: string } } }>;
      };

      const audio_base64 = data.choices?.[0]?.message?.audio?.data;
      if (!audio_base64) {
        return {
          content: [{ type: "text", text: "Error: No audio generated" }],
          is_error: true,
        };
      }

      const temp_dir = await mkdtemp(join(tmpdir(), "mcp-audio-"));
      const file_path = join(temp_dir, "audio.mp3");
      await writeFile(file_path, Buffer.from(audio_base64, "base64"));

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
