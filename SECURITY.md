# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in this project, please report it by emailing:

**Email:** arcaela.reyes@gmail.com

### What to include in your report

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### What to expect

- **Response time**: We aim to respond within 48 hours
- **Fix timeline**: Critical vulnerabilities will be patched within 7 days
- **Disclosure**: We follow responsible disclosure practices

### Security Best Practices

When using this MCP server:

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Store sensitive data in environment variables
3. **Access Control**: Limit MCP server access to trusted clients only
4. **Updates**: Keep dependencies up to date
5. **Validation**: All inputs are validated using Zod schemas

### Known Security Considerations

- **API Key Exposure**: Ensure `OPENAI_API_KEY` is not logged or exposed
- **File System Access**: Tools write to temporary directories (`/tmp/mcp-*`)
- **Network Requests**: All requests use HTTPS for OpenAI API
- **Input Validation**: Zod schemas validate all tool inputs before processing

### Dependencies

We regularly update dependencies to patch known vulnerabilities. Run:

```bash
npm audit
```

To check for known vulnerabilities in dependencies.

## Acknowledgements

We appreciate responsible disclosure and will acknowledge reporters in release notes (with permission).

## Contact

For general security questions: arcaela.reyes@gmail.com

For urgent security issues: Use the same email with subject "URGENT SECURITY"
