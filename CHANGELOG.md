# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-01

### Changed
- **BREAKING**: Complete architecture refactoring using modern MCP patterns
- Migrated from `Server` to `McpServer` API with `registerTool()`
- Replaced JSON Schema with Zod for type-safe validation
- Centralized configuration in `lib/config.ts`
- Created modular structure with `/src/lib/` directory
- Unified HTTP client with `lib/client.ts`
- Improved error handling with consistent `isError: true` pattern
- Enhanced TypeScript config with sourceMap and declarationMap
- Simplified to 3 tools: `audio`, `image`, `redesign`
- Removed `bgcleaner` and `resize` tools (external API dependency)
- Removed `CLIENT_ID` environment variable requirement

### Added
- Zod schema validation for all tool inputs
- Function `main()` with step-by-step initialization
- Professional logging with emojis (🚀, ✅, ❌, etc.)
- Validation of `OPENAI_API_KEY` at startup with early exit
- Type inference from Zod schemas for better DX
- `CHANGELOG.md` and `SECURITY.md` documentation

### Fixed
- TypeScript compilation errors
- Improved throttling implementation (700ms between requests)
- Better error messages with context

## [1.0.3] - 2026-01-30

### Added
- CLI arguments support: `--openai-key`, `--openai-url`, `--client-id`
- Configurable models via environment variables

## [1.0.2] - 2026-01-29

### Added
- `mcp` bin alias for npx compatibility

## [1.0.1] - 2026-01-28

### Fixed
- Build configuration issues
- Dependencies update

## [1.0.0] - 2026-01-28

### Added
- Initial release
- 4 tools: `image`, `audio`, `bgcleaner`, `resize`
- stdio and HTTP/SSE transport support
- OpenAI API integration
- Reference image support for image generation
