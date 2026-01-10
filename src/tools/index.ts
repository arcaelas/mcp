/**
 * @description MCP tools auto-registration
 */

import { image_tool } from "./image.js";
import { tts_tool } from "./tts.js";
import { cleaner_tool } from "./cleaner.js";
import { resize_tool } from "./resize.js";

export const TOOLS: IMCP.ToolDefinition[] = [
  image_tool,
  tts_tool,
  cleaner_tool,
  resize_tool,
];

export function get_tool(name: string): IMCP.ToolDefinition | undefined {
  return TOOLS.find(t => t.name === name);
}

export function list_tool_schemas() {
  return TOOLS.map(({ name, description, input_schema }) => ({
    name,
    description,
    inputSchema: input_schema,
  }));
}
