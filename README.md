# MCP Test Server

A minimal MCP (Model Context Protocol) server that exposes a single read-only tool
for testing ChatGPT access to a local file over a remote HTTPS tunnel.

## Requirements

- Node.js 20+ (tested with v22)
- npm 10+

## Installation

```bash
npm install
```

## Run

### Directly (TypeScript)

```bash
npx tsx src/server.ts
```

### Compiled (JavaScript)

```bash
npm run build
npm start
```

### Environment Variables

| Variable | Default | Description                |
|----------|---------|----------------------------|
| `PORT`   | `3000`  | Port the HTTP server binds |

## Test

```bash
npm test
```

This runs the bundled test client (`test-client.ts`) against the server.

## Connecting via a Remote HTTPS Tunnel

The server uses **Streamable HTTP** transport (the modern MCP remote
transport) at `GET/POST /mcp`. It is stateless — no SSE streaming or
session IDs — which means it passes cleanly through HTTPS tunnel
providers that buffer or terminate long-lived streams.

1. Start the server:

   ```bash
   npx tsx src/server.ts
   ```

2. Expose it through a tunnel of your choice:

   ```bash
   # Cloudflare Tunnel (free)
   cloudflared tunnel --url http://localhost:3000

   # ngrok (free tier)
   ngrok http 3000
   ```

3. Use the tunnel's HTTPS URL (e.g. `https://…trycloudflare.com/mcp`)
   as the MCP server URL in ChatGPT.

## MCP Endpoints

| Method | Path  | Purpose                                      |
|--------|-------|----------------------------------------------|
| `GET`  | `/mcp`| Not supported (returns 405); clients fall back to POST |
| `POST` | `/mcp`| Send JSON-RPC requests (stateless)           |

## Tools

### `read_test_file`

Reads the `hello.txt` file in the project root and returns its text content.

**No parameters.**

**Example response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Hello, MCP World!"
    }
  ]
}
```

## Security

This server is intentionally minimal and **read-only**. It exposes only
the `read_test_file` tool — no write, delete, or command-execution
capabilities. The file read is restricted to `hello.txt` in the project
root.
