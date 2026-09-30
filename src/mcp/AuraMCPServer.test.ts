import { AuraMCPServer } from './AuraMCPServer';
import { JSONRPCRequest } from './types';

describe('AuraMCPServer (Model Context Protocol Implementation)', () => {
  it('handles initialize handshake with protocol version 2024-11-05 and server info', async () => {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    };

    const response = await AuraMCPServer.handleRequest(request);
    expect(response.error).toBeUndefined();
    expect(response.result).toBeDefined();
    expect(response.result.protocolVersion).toBe('2024-11-05');
    expect(response.result.serverInfo.name).toBe('aura-cardiac-mcp-server');
    expect(response.result.capabilities.tools).toBeDefined();
    expect(response.result.capabilities.resources).toBeDefined();
    expect(response.result.capabilities.prompts).toBeDefined();
  });

  it('lists all registered cardiac MCP tools', async () => {
    const response = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });

    expect(response.error).toBeUndefined();
    const tools = response.result.tools;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBe(5);

    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain('aura_get_telemetry');
    expect(toolNames).toContain('aura_get_pacing_parameters');
    expect(toolNames).toContain('aura_calculate_safe_zone');
    expect(toolNames).toContain('aura_coach_query');
    expect(toolNames).toContain('aura_wearable_sync');
  });

  it('executes aura_get_telemetry tool and returns telemetry JSON', async () => {
    const response = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'aura_get_telemetry',
        arguments: { patientId: 'PAT-001' },
      },
    });

    expect(response.error).toBeUndefined();
    expect(response.result.content).toBeDefined();
    const data = JSON.parse(response.result.content[0].text);
    expect(data.heartRate).toBeGreaterThan(0);
    expect(data.thoracicImpedance).toBeGreaterThan(0);
  });

  it('executes aura_get_pacing_parameters tool', async () => {
    const response = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'aura_get_pacing_parameters',
        arguments: { patientId: 'PAT-001' },
      },
    });

    expect(response.error).toBeUndefined();
    const params = JSON.parse(response.result.content[0].text);
    expect(params.lowerRateLimit).toBe(60);
    expect(params.upperSensorRate).toBe(140);
  });

  it('calculates safe zones and evaluates current heart rate status', async () => {
    const response = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'aura_calculate_safe_zone',
        arguments: {
          lowerRateLimit: 60,
          upperSensorRate: 140,
          currentHeartRate: 75,
        },
      },
    });

    expect(response.error).toBeUndefined();
    const result = JSON.parse(response.result.content[0].text);
    expect(result.resting).toBe(60);
    expect(result.maxSafe).toBe(130);
    expect(result.summary).toContain('WITHIN the safe zone');
  });

  it('evaluates patient queries and enforces Priority 0 acute emergency triage', async () => {
    // Normal lifestyle query
    const normalResponse = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'aura_coach_query',
        arguments: { query: 'Can I exercise today?' },
      },
    });
    expect(normalResponse.result.content[0].text).toContain('clear');

    // Emergency symptom query
    const emergencyResponse = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'aura_coach_query',
        arguments: { query: 'I have severe chest pain and dizziness' },
      },
    });
    expect(emergencyResponse.result.content[0].text).toContain('911');
  });

  it('reads MCP resources for current telemetry and patient profile', async () => {
    // List resources
    const listRes = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 8,
      method: 'resources/list',
    });
    expect(listRes.result.resources.length).toBe(3);

    // Read current telemetry resource
    const readRes = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 9,
      method: 'resources/read',
      params: { uri: 'aura://telemetry/current' },
    });
    const content = JSON.parse(readRes.result.contents[0].text);
    expect(content.heartRate).toBeGreaterThan(0);
  });

  it('retrieves MCP prompts for clinical cardiac review', async () => {
    const listRes = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 10,
      method: 'prompts/list',
    });
    expect(listRes.result.prompts.length).toBe(2);

    const getRes = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 11,
      method: 'prompts/get',
      params: { name: 'cardiac_wellness_review' },
    });
    expect(getRes.result.messages[0].content.text).toContain('cardiac telemetry');
  });

  it('rejects invalid JSON-RPC requests with standard error codes', async () => {
    const invalidRes = await AuraMCPServer.handleRequest({
      jsonrpc: '1.0' as any,
      id: 12,
      method: 'initialize',
    });
    expect(invalidRes.error?.code).toBe(-32600);

    const unknownMethodRes = await AuraMCPServer.handleRequest({
      jsonrpc: '2.0',
      id: 13,
      method: 'non_existent_method',
    });
    expect(unknownMethodRes.error?.code).toBe(-32601);
  });
});
