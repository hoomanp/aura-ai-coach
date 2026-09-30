#!/usr/bin/env node
import { AuraMCPServer } from './AuraMCPServer';
import { JSONRPCRequest } from './types';
import * as readline from 'readline';

/**
 * CLI Stdio Transport entry point for AuraMCPServer.
 * Enables integration with Claude Desktop, Cursor, and any MCP-compliant AI client.
 */
function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  process.stderr.write('[Aura MCP] Stdio server initialized and listening...\n');

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request: JSONRPCRequest = JSON.parse(trimmed);
      const response = await AuraMCPServer.handleRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err: any) {
      process.stderr.write(`[Aura MCP] Error parsing message: ${err.message}\n`);
      const errorResponse = {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error: invalid JSON' },
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });

  process.on('SIGINT', () => {
    process.stderr.write('[Aura MCP] Received SIGINT. Shutting down.\n');
    process.exit(0);
  });
}

if (require.main === module) {
  startStdioServer();
}

export { startStdioServer };
