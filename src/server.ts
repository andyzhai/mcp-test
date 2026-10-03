#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const server = new Server(
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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_test_file',
        description: 'Reads the hello.txt file and returns its text content.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'read_test_file') {
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
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

const transports = new Map<string, SSEServerTransport>();

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  if (url.pathname === '/sse' && req.method === 'GET') {
    const transport = new SSEServerTransport('/message', res);
    transports.set(transport.sessionId, transport);

    await server.connect(transport);

    transport.onclose = () => {
      transports.delete(transport.sessionId);
    };

    return;
  }

  if (url.pathname === '/message' && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      res.writeHead(404);
      res.end('Session not found');
      return;
    }

    await transport.handlePostMessage(req, res);

    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

httpServer.listen(PORT, () => {
  console.log(`MCP server listening on http://localhost:${PORT}`);
});
