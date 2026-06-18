# Security Policy

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Report privately via GitHub → Security tab → "Report a vulnerability".

**Response time:** 48 hours.

## Scope

- Smart contracts in `contracts/`
- SDK source code in `src/`
- Any on-chain logic

## Recognition

Researchers who responsibly disclose vulnerabilities will be credited in release notes.

## Sensitive Variables

| Variable | Location | Risk if leaked |
|----------|----------|----------------|
| `ANTHROPIC_API_KEY` | Server-side only | AI cost abuse — HIGH |
| `COINGECKO_API_KEY` | Server-side only | Rate limit bypass — LOW |
| `HIRO_API_KEY` (if added) | Server-side only | Rate limit bypass — MEDIUM |

## Known Limitations

- Agent routes are rate limited to 10 requests/minute per IP (in-memory, resets on server restart)
- No authentication required to call the MCP server (public API by design)
- Bridge and swap actions require user to sign their own transactions — non-custodial
- In-memory rate limiter is per-instance; not shared across Vercel serverless function instances
