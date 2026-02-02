/**
 * @description Zod schemas for tool input validation
 */

import { z } from "zod";

const VOICES = ["nova", "alloy", "echo", "fable", "onyx", "shimmer", "coral", "sage"] as const;

export const audio = z.object({
  text: z.string().describe("Text to convert to speech"),
  voice: z
    .enum(VOICES)
    .default("nova")
    .describe(
      "Voice to use: nova (warm), alloy (neutral), echo (deep), fable (narrative), onyx (authoritative), shimmer (soft), coral (vibrant), sage (wise)"
    ),
});

export const image = z.object({
  prompt: z.string().describe("Text description of the image(s) to generate"),
  count: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(1)
    .describe("Number of images to generate (1-10)"),
});

export const redesign = z.object({
  prompt: z.string().describe("Text description of how to redesign the image"),
  filename: z.string().describe("Absolute path to the source image file"),
  count: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(1)
    .describe("Number of redesigned images to generate (1-10)"),
});
