/**
 * @description Centralized configuration with environment detection
 */

export const config = {
  server: {
    name: "arcaelas-mcp",
    version: "1.1.0",
  },
  openai: {
    api_key: process.env.OPENAI_API_KEY || "",
    base_url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    image_model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
    audio_model: process.env.OPENAI_AUDIO_MODEL || "gpt-4o-mini-audio",
  },
  generation: {
    throttle_ms: 700,
    max_images_per_request: 10,
  },
} as const;
