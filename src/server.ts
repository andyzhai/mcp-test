#!/usr/bin/env node
import { createServer, IncomingMessage } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'test-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.tool(
    'read_test_file',
    'Reads the hello.txt file and returns its text content.',
    async () => {
      const filePath = join(__dirname, '..', 'hello.txt');
      const content = await readFile(filePath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    },
  );

  return server;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) {
    return undefined;
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  if (url.pathname === '/mcp') {
    // This server is stateless and does not offer a GET SSE stream
    // (which would not survive proxies/tunnels that buffer streams anyway).
    // 405 is the spec-sanctioned signal; clients fall back to plain POST.
    if (req.method !== 'POST' && req.method !== 'DELETE') {
      res.writeHead(405, {
        Allow: 'POST, DELETE',
        'Content-Type': 'application/json',
      });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Method not allowed.' },
          id: null,
        }),
      );
      return;
    }

    // Stateless mode: fresh transport + server per request, no session IDs.
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const server = createMcpServer();

    res.on('close', () => {
      transport.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      const parsedBody = req.method === 'POST' ? await readJsonBody(req) : undefined;
      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.writeHead(500).end('Internal server error');
      }
    } finally {
      await server.close().catch(() => {});
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

httpServer.listen(PORT, () => {
  console.log(`MCP server listening on http://localhost:${PORT}/mcp`);
});
