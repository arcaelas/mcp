/**
 * @description Configured HTTP client for OpenAI API
 */

import { config } from "./config.js";

interface FetchOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

/**
 * Configured fetch client with OpenAI defaults
 */
export async function openai_fetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const url = `${config.openai.base_url}${endpoint}`;

  return fetch(url, {
    method: options.method || "POST",
    headers: {
      "Authorization": `Bearer ${config.openai.api_key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body,
  });
}
