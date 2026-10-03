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

## Build

```bash
npm run build
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

## Connecting via a Remote HTTPS Tunnel

The server uses SSE (Server-Sent Events) over HTTP, which is the standard MCP
remote transport. Expose it to ChatGPT through any HTTPS tunnel that preserves
HTTP headers and supports long-lived connections (SSE).

### Option A — Cloudflare Tunnel (free, no account limits)

```bash
cloudflared tunnel --url http://localhost:3000
```

Cloudflare assigns a public `https://<subdomain>.trycloudflare.com` URL. Use that
as the MCP server URL in ChatGPT.

### Option B — ngrok (free tier)

```bash
ngrok http 3000
```

ngrok provides a public `https://<subdomain>.ngrok-free.app` URL. Use that as
the MCP server URL in ChatGPT.

## MCP Endpoints

| Method | Path       | Purpose                                         |
|--------|------------|-------------------------------------------------|
| `GET`  | `/sse`     | Establish SSE stream; server returns endpoint   |
| `POST` | `/message` | Send JSON-RPC requests (with `?sessionId=ID`)   |

## Tools

### `read_test_file`

Reads the `hello.txt` file in the project root and returns its text content.

**No parameters.**

**Example response:**

```json
[
  {
    "type": "text",
    "text": "Hello, MCP World!"
  }
]
```

## Security

This server is intentionally minimal and **read-only**. It exposes no write,
delete, or command-execution capabilities. Only `hello.txt` can be read.
