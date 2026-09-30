import { MCPClientService } from './MCPClientService';
import { AuraMCPServer } from '../mcp/AuraMCPServer';
import { JSONRPCRequest, JSONRPCResponse } from '../mcp/types';

describe('MCPClientService (Model Context Protocol Client)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    MCPClientService.disconnect();
    jest.clearAllMocks();
  });

  afterEach(() => {
    MCPClientService.disconnect();
    global.fetch = originalFetch;
  });

  describe('In-Memory / Custom Transport (Connecting to AuraMCPServer)', () => {
    it('connects to in-memory MCP server and completes protocol handshake', async () => {
      const connectResult = await MCPClientService.connect({
        serverUrl: 'memory://aura-server',
        serverName: 'Aura In-Memory Server',
        customTransport: async (req: JSONRPCRequest): Promise<JSONRPCResponse> => {
          return AuraMCPServer.handleRequest(req);
        },
      });

      expect(connectResult.success).toBe(true);
      expect(connectResult.info?.serverInfo.name).toBe('aura-cardiac-mcp-server');
      expect(MCPClientService.isConnected()).toBe(true);
      expect(MCPClientService.getServerInfo()?.serverInfo.version).toBe('1.0.0');
    });

    it('discovers tools from the connected server', async () => {
      await MCPClientService.connect({
        serverUrl: 'memory://aura-server',
        customTransport: async (req: JSONRPCRequest) => AuraMCPServer.handleRequest(req),
      });

      const tools = await MCPClientService.listTools();
      expect(tools.length).toBeGreaterThanOrEqual(5);

      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain('aura_get_telemetry');
      expect(toolNames).toContain('aura_get_pacing_parameters');
      expect(toolNames).toContain('aura_calculate_safe_zone');
      expect(toolNames).toContain('aura_coach_query');
      expect(toolNames).toContain('aura_wearable_sync');
    });

    it('invokes an MCP tool and retrieves structured result', async () => {
      await MCPClientService.connect({
        serverUrl: 'memory://aura-server',
        customTransport: async (req: JSONRPCRequest) => AuraMCPServer.handleRequest(req),
      });

      const result = await MCPClientService.callTool('aura_calculate_safe_zone', {
        lowerRateLimit: 60,
        upperSensorRate: 140,
        currentHeartRate: 75,
      });

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text || '{}');
      expect(parsed.maxSafe).toBe(130);
      expect(parsed.summary).toContain('WITHIN the safe zone');
    });

    it('gracefully handles server errors when calling an unknown tool', async () => {
      await MCPClientService.connect({
        serverUrl: 'memory://aura-server',
        customTransport: async (req: JSONRPCRequest) => AuraMCPServer.handleRequest(req),
      });

      const result = await MCPClientService.callTool('unknown_external_tool', {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    it('discovers and reads MCP resources', async () => {
      await MCPClientService.connect({
        serverUrl: 'memory://aura-server',
        customTransport: async (req: JSONRPCRequest) => AuraMCPServer.handleRequest(req),
      });

      const resources = await MCPClientService.listResources();
      expect(resources.length).toBeGreaterThanOrEqual(3);
      expect(resources.map((r) => r.uri)).toContain('aura://clinical/guidelines');

      const contents = await MCPClientService.readResource('aura://clinical/guidelines');
      expect(contents.length).toBe(1);
      expect(contents[0].text).toContain('Aura Cardiac Clinical Guidelines');
    });

    it('discovers MCP prompts', async () => {
      await MCPClientService.connect({
        serverUrl: 'memory://aura-server',
        customTransport: async (req: JSONRPCRequest) => AuraMCPServer.handleRequest(req),
      });

      const prompts = await MCPClientService.listPrompts();
      expect(prompts.length).toBeGreaterThanOrEqual(2);
      expect(prompts.map((p) => p.name)).toContain('cardiac_wellness_review');
    });
  });

  describe('Session Lifecycle and Disconnected State Validation', () => {
    it('throws errors when invoking methods while disconnected', async () => {
      expect(MCPClientService.isConnected()).toBe(false);
      expect(MCPClientService.getServerInfo()).toBeNull();

      await expect(MCPClientService.listTools()).rejects.toThrow('MCP Client is not connected');
      await expect(MCPClientService.callTool('any_tool')).rejects.toThrow('MCP Client is not connected');
      await expect(MCPClientService.listResources()).rejects.toThrow('MCP Client is not connected');
      await expect(MCPClientService.readResource('any_uri')).rejects.toThrow('MCP Client is not connected');
      await expect(MCPClientService.listPrompts()).rejects.toThrow('MCP Client is not connected');
    });

    it('disconnects and resets all active session state', async () => {
      await MCPClientService.connect({
        serverUrl: 'memory://aura-server',
        customTransport: async (req: JSONRPCRequest) => AuraMCPServer.handleRequest(req),
      });
      expect(MCPClientService.isConnected()).toBe(true);

      MCPClientService.disconnect();
      expect(MCPClientService.isConnected()).toBe(false);
      expect(MCPClientService.getServerInfo()).toBeNull();
    });

    it('handles initialization handshake failure cleanly', async () => {
      const result = await MCPClientService.connect({
        serverUrl: 'memory://broken-server',
        customTransport: async () => {
          return {
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32603, message: 'Server internal handshake error' },
          };
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server internal handshake error');
      expect(MCPClientService.isConnected()).toBe(false);
    });

    it('handles transport exception during connection', async () => {
      const result = await MCPClientService.connect({
        serverUrl: 'memory://throwing-server',
        customTransport: async () => {
          throw new Error('Connection refused');
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
      expect(MCPClientService.isConnected()).toBe(false);
    });
  });

  describe('HTTP JSON-RPC Transport (External Servers: Clinics, EHR, etc.)', () => {
    it('connects to remote HTTP MCP server with Bearer auth token and standard headers', async () => {
      const mockFetch = jest.fn();
      // Initialize response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'cardiology-clinic-ehr', version: '2.1.0' },
          },
        }),
      });
      // Initialized notification response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      global.fetch = mockFetch as any;

      const connectResult = await MCPClientService.connect({
        serverUrl: 'https://cardiology.hospital.org/mcp',
        authToken: 'clinical-token-xyz',
      });

      expect(connectResult.success).toBe(true);
      expect(MCPClientService.isConnected()).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify handshake request formatting
      const firstCallArgs = mockFetch.mock.calls[0];
      expect(firstCallArgs[0]).toBe('https://cardiology.hospital.org/mcp');
      expect(firstCallArgs[1].headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer clinical-token-xyz',
      });
      const parsedBody = JSON.parse(firstCallArgs[1].body);
      expect(parsedBody.method).toBe('initialize');
      expect(parsedBody.params.protocolVersion).toBe('2024-11-05');
    });

    it('handles HTTP error responses gracefully', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      });
      global.fetch = mockFetch as any;

      const connectResult = await MCPClientService.connect({
        serverUrl: 'https://broken-gateway.hospital.org/mcp',
      });

      expect(connectResult.success).toBe(false);
      expect(connectResult.error).toContain('HTTP error 502: Bad Gateway');
      expect(MCPClientService.isConnected()).toBe(false);
    });

    it('propagates server errors when listing tools over HTTP', async () => {
      const mockFetch = jest.fn()
        // Handshake
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              serverInfo: { name: 'test', version: '1.0' },
            },
          }),
        })
        // Notification
        .mockResolvedValueOnce({ ok: true })
        // tools/list returns JSON-RPC error
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 2,
            error: { code: -32601, message: 'Method not found' },
          }),
        });

      global.fetch = mockFetch as any;

      await MCPClientService.connect({ serverUrl: 'https://test-server.org/mcp' });
      await expect(MCPClientService.listTools()).rejects.toThrow('tools/list failed: Method not found');
    });

    it('propagates server errors when listing resources or prompts over HTTP', async () => {
      const mockFetch = jest.fn()
        // Handshake
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              serverInfo: { name: 'test', version: '1.0' },
            },
          }),
        })
        // Notification
        .mockResolvedValueOnce({ ok: true })
        // resources/list error
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 2,
            error: { code: -32000, message: 'Resource access unauthorized' },
          }),
        })
        // prompts/list error
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 3,
            error: { code: -32000, message: 'Prompts disabled' },
          }),
        })
        // resources/read error
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 4,
            error: { code: -32002, message: 'Resource not found' },
          }),
        });

      global.fetch = mockFetch as any;

      await MCPClientService.connect({ serverUrl: 'https://test-server.org/mcp' });
      await expect(MCPClientService.listResources()).rejects.toThrow('resources/list failed: Resource access unauthorized');
      await expect(MCPClientService.listPrompts()).rejects.toThrow('prompts/list failed: Prompts disabled');
      await expect(MCPClientService.readResource('aura://unknown')).rejects.toThrow('resources/read failed: Resource not found');
    });
  });
});
