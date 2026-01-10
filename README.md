# @arcaelas/mcp

A modular MCP (Model Context Protocol) server providing AI-powered tools for image generation, text-to-speech, background removal, and image upscaling.

## Installation

```bash
npm install -g @arcaelas/mcp
```

## Usage

### stdio Mode

For Claude Desktop, Cline, and other MCP clients that support stdio transport:

```bash
arcaelas-mcp --stdio
```

**Claude Desktop Configuration** (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "arcaelas": {
      "command": "npx",
      "args": ["-y", "@arcaelas/mcp", "--stdio"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "CLIENT_ID": "your-client-id"
      }
    }
  }
}
```

### HTTP/SSE Mode

For clients that support HTTP transport (Cursor, etc.):

```bash
# Default port (3100)
arcaelas-mcp

# Custom port
arcaelas-mcp --port 8080
```

**Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | Server-Sent Events connection |
| `/messages` | POST | Send messages (requires `sessionId` query param) |
| `/health` | GET | Health check and server info |

## Tools

### image

Generate images using AI with optional reference images for style guidance.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Image description in English |
| `width` | number | No | `1024` | Output width (max 1024, auto-scaled if larger) |
| `height` | number | No | `1024` | Output height (max 1024, auto-scaled if larger) |
| `reference_images` | array | No | `[]` | Paths to reference images (max 2, max 3MB each) |

### audio

Convert text to speech with natural-sounding voices.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | Yes | - | Text to synthesize |
| `voice` | string | No | `nova` | Voice: `nova`, `alloy`, `echo`, `fable`, `onyx`, `shimmer`, `coral`, `sage` |

### bgcleaner

Remove backgrounds from images using AI with high precision edge detection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_path` | string | Yes | Absolute path to source image (PNG, JPG, WEBP) |

**Output:** Returns path to folder containing processed PNG with transparent background.

### resize

Upscale images using AI without quality loss.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_path` | string | Yes | - | Absolute path to source image |
| `scale` | number | No | `2` | Scale factor: `2`, `3`, or `4` |
| `model` | string | No | `plus` | Model: `diffuser`, `plus`, `general` |
| `face_enhance` | boolean | No | `false` | Enhance faces (`plus`/`general` only) |

**Models:**
- `diffuser` — Best for small images, more creative results
- `plus` — Balanced for medium to large images
- `general` — Optimized for very large images

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes* | OpenAI API key (required for `image` and `audio` tools) |
| `OPENAI_BASE_URL` | No | Custom OpenAI-compatible API endpoint |
| `CLIENT_ID` | Yes* | Client ID for image processing services (required for `bgcleaner` and `resize`) |

## CLI Arguments

| Argument | Description |
|----------|-------------|
| `--stdio` | Run in stdio mode (for Claude Desktop, etc.) |
| `--port <number>` | HTTP server port (default: 3100) |
| `--client-id <id>` | Client ID for image processing services |
| `--openai-key <key>` | OpenAI API key |
| `--openai-url <url>` | Custom OpenAI-compatible API endpoint |

## Examples

```bash
# Using CLI arguments
npx -y @arcaelas/mcp --stdio --client-id xxx --openai-key sk-xxx

# Using environment variables
OPENAI_API_KEY=sk-xxx CLIENT_ID=xxx npx -y @arcaelas/mcp --stdio

# HTTP server on custom port
npx -y @arcaelas/mcp --port 8080 --client-id xxx --openai-key sk-xxx
```

## License

MIT
