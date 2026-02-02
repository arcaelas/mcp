# @arcaelas/mcp

[![npm version](https://badge.fury.io/js/@arcaelas%2Fmcp.svg)](https://www.npmjs.com/package/@arcaelas/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

MCP server providing AI-powered tools for audio generation, image generation, and image redesign using OpenAI-compatible APIs.

**Build intelligent AI workflows with multimodal generation** - Generate speech from text, create images from prompts, and redesign existing images using state-of-the-art AI models.

## Features

- 🎤 **Text-to-Speech** with 8 natural voices
- 🎨 **Image Generation** from text prompts
- 🔄 **Image Redesign** with reference images
- 🚀 **Dual Transport** - stdio and HTTP/SSE
- 🔧 **Type-Safe** with Zod validation
- ⚡ **Throttling** to prevent API rate limits

## Prerequisites

- Node.js >= 18
- OpenAI API key (or compatible endpoint)

## Installation

### Using npx (recommended)

Add to your `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arcaelas": {
      "command": "npx",
      "args": ["-y", "@arcaelas/mcp", "--stdio"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

### Global installation

```bash
npm install -g @arcaelas/mcp

# Or with yarn
yarn global add @arcaelas/mcp
```

Then in `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arcaelas": {
      "command": "arcaelas-mcp",
      "args": ["--stdio"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for authentication |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Custom OpenAI-compatible API endpoint |
| `OPENAI_IMAGE_MODEL` | No | `dall-e-3` | Model to use for image generation and redesign |
| `OPENAI_AUDIO_MODEL` | No | `gpt-4o-mini-audio` | Model to use for audio generation |

## Available Tools

### `audio(text, voice?)`

Generate speech audio from text using AI text-to-speech.

**Parameters:**
- `text` (string, required): Text to convert to speech
- `voice` (string, optional): Voice name - `nova`, `alloy`, `echo`, `fable`, `onyx`, `shimmer`, `coral`, `sage` (default: `nova`)

**Returns:** File path to the generated MP3 audio file.

**Example:**
```typescript
await audio("Hello world, this is a test", "nova")
// Returns: "/tmp/mcp-audio-xyz/audio.mp3"
```

### `image(prompt, count?)`

Generate one or more images from a text prompt using AI.

**Parameters:**
- `prompt` (string, required): Text description of the image(s) to generate
- `count` (number, optional): Number of images to generate, 1-10 (default: `1`)

**Returns:** Newline-separated file paths to the generated PNG images.

**Example:**
```typescript
await image("A serene mountain landscape at sunset", 3)
// Returns: "/tmp/mcp-image-abc/image_1.png\n/tmp/mcp-image-def/image_2.png\n/tmp/mcp-image-ghi/image_3.png"
```

**Note:** Each image generation includes a 700ms throttle delay to prevent API rate limiting.

### `redesign(prompt, filename, count?)`

Redesign an existing image based on a text prompt.

**Parameters:**
- `prompt` (string, required): Text description of how to redesign the image
- `filename` (string, required): Absolute path to the source image file
- `count` (number, optional): Number of redesigned images to generate, 1-10 (default: `1`)

**Returns:** Newline-separated file paths to the generated PNG images.

**Example:**
```typescript
await redesign("Make it look like a watercolor painting", "/path/to/photo.jpg", 2)
// Returns: "/tmp/mcp-redesign-xyz/redesign_1.png\n/tmp/mcp-redesign-abc/redesign_2.png"
```

**Note:** Reads the source image, converts to base64, and uses vision API for redesign. Each generation includes a 700ms throttle delay.

## CLI Arguments

| Argument | Description |
|----------|-------------|
| `--stdio` | Run in stdio mode (for Claude Desktop, etc.) |
| `--port <number>` | HTTP server port (default: 3100) |
| `--openai-key <key>` | OpenAI API key (overrides OPENAI_API_KEY env var) |
| `--openai-url <url>` | Custom OpenAI-compatible API endpoint (overrides OPENAI_BASE_URL) |
| `--image-model <model>` | Model for image generation (overrides OPENAI_IMAGE_MODEL) |
| `--audio-model <model>` | Model for audio generation (overrides OPENAI_AUDIO_MODEL) |

## Usage Examples

### stdio Mode (Claude Desktop)

```bash
# Using environment variables
OPENAI_API_KEY=sk-xxx npx -y @arcaelas/mcp --stdio

# Using CLI arguments
npx -y @arcaelas/mcp --stdio --openai-key sk-xxx
```

### HTTP/SSE Mode (Cursor, etc.)

```bash
# Default port (3100)
OPENAI_API_KEY=sk-xxx npx -y @arcaelas/mcp

# Custom port with custom models
npx -y @arcaelas/mcp --port 8080 \
  --openai-key sk-xxx \
  --image-model dall-e-3 \
  --audio-model gpt-4o-mini-audio

# With custom OpenAI-compatible endpoint
npx -y @arcaelas/mcp --stdio \
  --openai-url https://api.custom.ai/v1 \
  --openai-key xxx
```

### HTTP Endpoints (HTTP/SSE mode)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | Server-Sent Events connection |
| `/messages?sessionId=<uuid>` | POST | Send messages to specific session |
| `/health` | GET | Health check and server info |

## How It Works

All tools use OpenAI's `/chat/completions` endpoint with appropriate models and modalities:

- **audio**: Uses the audio modality with the configured audio model (default: `gpt-4o-mini-audio`). Generates MP3 files with natural-sounding voices.
- **image**: Generates images by sending prompts to the chat completions endpoint with the configured image model (default: `dall-e-3`). Supports batch generation with automatic throttling.
- **redesign**: Similar to image but includes the source image as a base64-encoded image_url in the message content for vision-based redesign.

Generated files are stored in temporary directories (`/tmp/mcp-*`) and the file paths are returned to the client.

## Development

```bash
# Clone repository
git clone https://github.com/arcaelas/mcp.git
cd mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start

# Watch mode
npm run dev

# MCP Inspector (for testing)
npm run inspector
```

## Architecture

This project uses modern MCP patterns inspired by best practices:

- **Zod Schemas** for type-safe validation
- **McpServer API** with `registerTool()` registration
- **Modular Structure** with `/lib/` for reusable code
- **Centralized Config** in `lib/config.ts`
- **HTTP Client** abstraction in `lib/client.ts`
- **Type Inference** from Zod schemas

```
src/
├── index.ts           → Main entry point with tool registration
├── schemas.ts         → Zod validation schemas
├── lib/
│   ├── config.ts      → Centralized configuration
│   └── client.ts      → Configured HTTP client
└── tools/
    ├── audio.ts       → Text-to-speech handler
    ├── image.ts       → Image generation handler
    └── redesign.ts    → Image redesign handler
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

See [SECURITY.md](SECURITY.md) for security policies and reporting vulnerabilities.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

MIT © Miguel Guevara (Arcaela)

## Links

- [npm Package](https://www.npmjs.com/package/@arcaelas/mcp)
- [GitHub Repository](https://github.com/arcaelas/mcp)
- [Issues & Bug Reports](https://github.com/arcaelas/mcp/issues)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [OpenAI API](https://platform.openai.com/docs)

## Support

- 📧 Email: arcaela.reyes@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/arcaelas/mcp/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/arcaelas/mcp/discussions)
