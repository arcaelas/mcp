/**
 * @description Text-to-speech audio generation using OpenAI API
 */

import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { config } from "../lib/config.js";
import { openai_fetch } from "../lib/client.js";
import { z } from "zod";
import * as schemas from "../schemas.js";

type AudioInput = z.infer<typeof schemas.audio>;

/**
 * Generate speech audio from text
 * @param input - Text and voice parameters
 * @returns File path to generated MP3
 */
export async function audio_handler(input: AudioInput): Promise<string> {
  const response = await openai_fetch("/chat/completions", {
    body: JSON.stringify({
      model: config.openai.audio_model,
      modalities: ["text", "audio"],
      audio: { voice: input.voice, format: "mp3" },
      messages: [{
        role: "user",
        content: `Say exactly: ${input.text}`,
      }],
    }),
  });

  if (!response.ok) {
    const error_text = await response.text();
    throw new Error(`API Error ${response.status}: ${error_text}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { audio?: { data?: string } } }>;
  };

  const audio_base64 = data.choices?.[0]?.message?.audio?.data;
  if (!audio_base64) {
    throw new Error("No audio data received from API");
  }

  const temp_dir = await mkdtemp(join(tmpdir(), "mcp-audio-"));
  const file_path = join(temp_dir, "audio.mp3");
  await writeFile(file_path, Buffer.from(audio_base64, "base64"));

  return file_path;
}
