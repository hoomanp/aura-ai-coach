import {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPToolDefinition,
  MCPToolResult,
  MCPResourceDefinition,
  MCPResourceContent,
  MCPPromptDefinition,
  MCPInitializeResult,
} from '../mcp/types';

export interface MCPEndpointConfig {
  serverUrl: string;
  serverName?: string;
  authToken?: string;
  timeoutMs?: number;
  /** Custom request handler for in-memory or mock testing */
  customTransport?: (request: JSONRPCRequest) => Promise<JSONRPCResponse>;
}

/**
 * MCPClientService: Production-grade Model Context Protocol (MCP) Client.
 * Allows Aura AI Coach mobile client or backend companion to connect to external
 * MCP servers (e.g., Cardiology Clinic MCP, EHR Systems, Medication Tracking, or Weather/Air Quality).
 */
export class MCPClientService {
  private static config: MCPEndpointConfig | null = null;
  private static isSessionActive = false;
  private static requestIdCounter = 1;
  private static serverCapabilities: MCPInitializeResult | null = null;

  /**
   * Connects to a remote or in-memory MCP server and executes the protocol handshake.
   */
  static async connect(config: MCPEndpointConfig): Promise<{ success: boolean; info?: MCPInitializeResult; error?: string }> {
    this.config = {
      timeoutMs: 8000,
      ...config,
    };

    try {
      const initRequest: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: this.nextId(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          clientInfo: {
            name: 'aura-mobile-mcp-client',
            version: '1.0.0',
          },
        },
      };

      const response = await this.sendRequest(initRequest);
      if (response.error) {
        return { success: false, error: response.error.message };
      }

      this.serverCapabilities = response.result as MCPInitializeResult;
      this.isSessionActive = true;

      // Send initialized notification as required by MCP spec
      await this.sendNotification({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      });

      if (__DEV__) {
        console.log(`[MCP Client] Connected to ${this.serverCapabilities.serverInfo.name} v${this.serverCapabilities.serverInfo.version}`);
      }

      return { success: true, info: this.serverCapabilities };
    } catch (err: any) {
      this.isSessionActive = false;
      return { success: false, error: err.message || 'Failed to initialize MCP connection' };
    }
  }

  /**
   * Discovers tools offered by the connected MCP server.
   */
  static async listTools(): Promise<MCPToolDefinition[]> {
    this.ensureConnected();
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'tools/list',
    });

    if (response.error) {
      throw new Error(`tools/list failed: ${response.error.message}`);
    }

    return response.result?.tools || [];
  }

  /**
   * Invokes an MCP tool on the connected server.
   */
  static async callTool(name: string, args: Record<string, any> = {}): Promise<MCPToolResult> {
    this.ensureConnected();
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    });

    if (response.error) {
      return {
        content: [{ type: 'text', text: `Error: ${response.error.message}` }],
        isError: true,
      };
    }

    return response.result as MCPToolResult;
  }

  /**
   * Discovers resources available on the connected MCP server.
   */
  static async listResources(): Promise<MCPResourceDefinition[]> {
    this.ensureConnected();
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'resources/list',
    });

    if (response.error) {
      throw new Error(`resources/list failed: ${response.error.message}`);
    }

    return response.result?.resources || [];
  }

  /**
   * Reads a resource by URI from the connected MCP server.
   */
  static async readResource(uri: string): Promise<MCPResourceContent[]> {
    this.ensureConnected();
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'resources/read',
      params: { uri },
    });

    if (response.error) {
      throw new Error(`resources/read failed: ${response.error.message}`);
    }

    return response.result?.contents || [];
  }

  /**
   * Discovers prompts available on the connected MCP server.
   */
  static async listPrompts(): Promise<MCPPromptDefinition[]> {
    this.ensureConnected();
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'prompts/list',
    });

    if (response.error) {
      throw new Error(`prompts/list failed: ${response.error.message}`);
    }

    return response.result?.prompts || [];
  }

  /**
   * Checks if an active MCP connection session is established.
   */
  static isConnected(): boolean {
    return this.isSessionActive;
  }

  /**
   * Gets current connected server information, if any.
   */
  static getServerInfo(): MCPInitializeResult | null {
    return this.serverCapabilities;
  }

  /**
   * Disconnects the active MCP session and flushes state.
   */
  static disconnect(): void {
    this.config = null;
    this.isSessionActive = false;
    this.serverCapabilities = null;
    if (__DEV__) console.log('[MCP Client] Disconnected from MCP server');
  }

  /**
   * Generates monotonic JSON-RPC request identifiers.
   */
  private static nextId(): number {
    return this.requestIdCounter++;
  }

  /**
   * Verifies session is active before sending requests.
   */
  private static ensureConnected(): void {
    if (!this.isSessionActive || !this.config) {
      throw new Error('MCP Client is not connected to any server. Call MCPClientService.connect() first.');
    }
  }

  /**
   * Sends a JSON-RPC request over HTTP or in-memory transport.
   */
  private static async sendRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (!this.config) {
      throw new Error('MCP Client configuration missing.');
    }

    // 1. In-memory / custom transport hook (useful for tests and in-process servers)
    if (this.config.customTransport) {
      return this.config.customTransport(request);
    }

    // 2. HTTP JSON-RPC transport (standard for remote MCP servers)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.config.authToken) {
      headers.Authorization = `Bearer ${this.config.authToken}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.config.serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const jsonResponse: JSONRPCResponse = await response.json();
      return jsonResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Sends a JSON-RPC notification (no response expected).
   */
  private static async sendNotification(notification: { jsonrpc: '2.0'; method: string; params?: any }): Promise<void> {
    if (!this.config) return;

    if (this.config.customTransport) {
      await this.config.customTransport(notification as JSONRPCRequest);
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.authToken) {
      headers.Authorization = `Bearer ${this.config.authToken}`;
    }

    try {
      await fetch(this.config.serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(notification),
      });
    } catch {
      // Notifications are fire-and-forget under JSON-RPC spec
    }
  }
}
