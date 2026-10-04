import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = process.argv[2] || 'http://localhost:3000/mcp';
const client = new Client({ name: 'test-client', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(new URL(url));

await client.connect(transport);
console.log('connected');

const tools = await client.listTools();
console.log('tools:', JSON.stringify(tools.tools.map(t => t.name)));

const result = await client.callTool({ name: 'read_test_file' });
console.log('callTool result:', JSON.stringify(result));

await client.close();
console.log('done');
