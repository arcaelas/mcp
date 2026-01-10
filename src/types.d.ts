/**
 * @description Global type declarations for the MCP server
 */

declare global {
  namespace IMCP {
    /** JSON schema for tool parameters */
    interface JsonSchema {
      type: "object";
      properties: Record<string, {
        type: "string" | "number" | "boolean" | "array" | "object";
        description: string;
        enum?: (string | number)[];
        items?: JsonSchema;
        default?: unknown;
      }>;
      required?: string[];
    }

    /** MCP tool definition */
    interface ToolDefinition {
      /** Unique tool name */
      name: string;
      /** Tool description */
      description: string;
      /** Input parameters schema */
      input_schema: JsonSchema;
      /** Handler that executes the tool */
      handler: (args: Record<string, unknown>) => Promise<ToolResult>;
    }

    /** Tool execution result */
    interface ToolResult {
      content: Array<{
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mime_type?: string;
      }>;
      is_error?: boolean;
    }

    /** MCP server configuration */
    interface ServerConfig {
      /** Server name */
      name: string;
      /** Server version */
      version: string;
      /** Server description */
      description?: string;
    }
  }
}

export {};
