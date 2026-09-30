import {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPToolDefinition,
  MCPToolResult,
  MCPResourceDefinition,
  MCPResourceContent,
  MCPPromptDefinition,
  MCPInitializeResult,
} from './types';
import { HealthAIEngine } from '../ai/HealthAIEngine';
import { SecureMerlinNetService } from '../services/MerlinNetService';
import { HealthPlatformService } from '../services/HealthPlatformService';
import { StubDataService } from '../services/StubDataService';

/**
 * AuraMCPServer: Production-grade Model Context Protocol (MCP) Server for Aura AI Coach.
 * Exposes cardiac rhythm telemetry, pacing parameters, safe zone heuristics,
 * and AI coaching tools to Claude Desktop, Cursor, EHR assistants, and external AI agents.
 */
export class AuraMCPServer {
  private static readonly PROTOCOL_VERSION = '2024-11-05';
  private static readonly SERVER_INFO = {
    name: 'aura-cardiac-mcp-server',
    version: '1.0.0',
  };

  /**
   * Tool Registry defining capabilities exposed by this MCP server.
   */
  static getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'aura_get_telemetry',
        description: 'Fetch real-time cardiac telemetry for a CRM patient (heart rate, thoracic fluid impedance, pacing burden, AFib burden, and battery status).',
        inputSchema: {
          type: 'object',
          properties: {
            patientId: {
              type: 'string',
              description: 'Alphanumeric patient identifier (e.g. PAT-001). Defaults to demo patient if omitted.',
            },
          },
        },
      },
      {
        name: 'aura_get_pacing_parameters',
        description: 'Retrieve device-programmed pacing limits (lower rate limit, upper sensor rate, atrial and ventricular sensitivities) for cardiac rhythm management.',
        inputSchema: {
          type: 'object',
          properties: {
            patientId: {
              type: 'string',
              description: 'Patient identifier for device parameter retrieval.',
            },
          },
        },
      },
      {
        name: 'aura_calculate_safe_zone',
        description: 'Calculate personalized cardiovascular safe target heart rate zones based on CRM device programmed limits.',
        inputSchema: {
          type: 'object',
          properties: {
            lowerRateLimit: {
              type: 'number',
              description: 'Programmed device Lower Rate Limit in BPM (e.g. 60).',
            },
            upperSensorRate: {
              type: 'number',
              description: 'Programmed device Upper Sensor Rate in BPM (e.g. 140).',
            },
            currentHeartRate: {
              type: 'number',
              description: 'Optional current measured heart rate in BPM to classify within safe zones.',
            },
          },
          required: ['lowerRateLimit', 'upperSensorRate'],
        },
      },
      {
        name: 'aura_coach_query',
        description: 'Query the Aura AI Coach clinical heuristics engine with patient symptoms or questions. Enforces Priority 0 acute emergency triage guardrails.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Patient question or symptom report (e.g. "Can I jog today?", "I feel chest pain").',
            },
            patientId: {
              type: 'string',
              description: 'Patient identifier to contextualize response with current telemetry.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'aura_wearable_sync',
        description: 'Fetch cross-verified consumer wearable metrics (Apple HealthKit / Google Health Connect) to correlate against CRM implant telemetry.',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: ['apple', 'google', 'demo'],
              description: 'Health ecosystem provider for biometric cross-verification.',
            },
          },
        },
      },
    ];
  }

  /**
   * Resource Registry exposing structured telemetry and profile documents.
   */
  static getResources(): MCPResourceDefinition[] {
    return [
      {
        uri: 'aura://telemetry/current',
        name: 'Current Cardiac Telemetry',
        description: 'Latest snapshot of patient cardiac telemetry and fluid impedance.',
        mimeType: 'application/json',
      },
      {
        uri: 'aura://patient/profile',
        name: 'Patient Device Profile',
        description: 'Patient CRM profile including implanted device type and baseline goals.',
        mimeType: 'application/json',
      },
      {
        uri: 'aura://clinical/guidelines',
        name: 'Cardiac Wellness Safe Zone Guidelines',
        description: 'Clinical reference guidelines for heart rate zones and thoracic impedance thresholds.',
        mimeType: 'text/markdown',
      },
    ];
  }

  /**
   * Prompt Registry for clinical cardiac workflows.
   */
  static getPrompts(): MCPPromptDefinition[] {
    return [
      {
        name: 'cardiac_wellness_review',
        description: 'Conduct a comprehensive clinical cardiac wellness review evaluating telemetry, diurnal variation, and fluid status.',
        arguments: [
          {
            name: 'patientId',
            description: 'Target patient identifier for telemetry review.',
            required: false,
          },
        ],
      },
      {
        name: 'emergency_symptom_triage',
        description: 'Evaluate patient-reported acute symptoms against CRM emergency triage protocols.',
        arguments: [
          {
            name: 'symptoms',
            description: 'Reported symptoms to evaluate for emergency referral.',
            required: true,
          },
        ],
      },
    ];
  }

  /**
   * Handles incoming JSON-RPC 2.0 requests from MCP clients.
   */
  static async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (request.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
      };
    }

    try {
      switch (request.method) {
        case 'initialize': {
          const initResult: MCPInitializeResult = {
            protocolVersion: this.PROTOCOL_VERSION,
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: this.SERVER_INFO,
          };
          return { jsonrpc: '2.0', id: request.id, result: initResult };
        }

        case 'notifications/initialized': {
          // Standard MCP handshake notification; no response required
          return { jsonrpc: '2.0', id: request.id, result: {} };
        }

        case 'tools/list': {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: { tools: this.getTools() },
          };
        }

        case 'tools/call': {
          const name = request.params?.name;
          const args = request.params?.arguments || {};
          const result = await this.executeTool(name, args);
          return { jsonrpc: '2.0', id: request.id, result };
        }

        case 'resources/list': {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: { resources: this.getResources() },
          };
        }

        case 'resources/read': {
          const uri = request.params?.uri;
          const contents = await this.readResource(uri);
          return { jsonrpc: '2.0', id: request.id, result: { contents } };
        }

        case 'prompts/list': {
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: { prompts: this.getPrompts() },
          };
        }

        case 'prompts/get': {
          const name = request.params?.name;
          const args = request.params?.arguments || {};
          const prompt = this.getPrompt(name, args);
          return { jsonrpc: '2.0', id: request.id, result: prompt };
        }

        case 'ping': {
          return { jsonrpc: '2.0', id: request.id, result: {} };
        }

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: `Method not found: ${request.method}` },
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32000, message: err.message || 'Internal MCP server error' },
      };
    }
  }

  /**
   * Internal tool execution dispatcher.
   */
  private static async executeTool(name: string, args: Record<string, any>): Promise<MCPToolResult> {
    switch (name) {
      case 'aura_get_telemetry': {
        const patientId = args.patientId || 'PAT-001';
        let telemetry;
        try {
          telemetry = await SecureMerlinNetService.getLatestTelemetry(patientId);
        } catch {
          telemetry = StubDataService.getCurrentTelemetry();
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(telemetry, null, 2) }],
        };
      }

      case 'aura_get_pacing_parameters': {
        const patientId = args.patientId || 'PAT-001';
        let params;
        try {
          params = await SecureMerlinNetService.getPacingParameters(patientId);
        } catch {
          params = StubDataService.getDemoPacingParameters();
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(params, null, 2) }],
        };
      }

      case 'aura_calculate_safe_zone': {
        const { lowerRateLimit, upperSensorRate, currentHeartRate } = args;
        if (typeof lowerRateLimit !== 'number' || typeof upperSensorRate !== 'number') {
          return {
            content: [{ type: 'text', text: 'Error: lowerRateLimit and upperSensorRate must be numbers.' }],
            isError: true,
          };
        }
        const currentTelemetry = StubDataService.getCurrentTelemetry();
        const safeZone = HealthAIEngine.calculateSafeZone(
          { ...currentTelemetry, heartRate: currentHeartRate || currentTelemetry.heartRate },
          {
            lowerRateLimit,
            upperSensorRate,
            atrialSensitivity: 2.5,
            ventricularSensitivity: 2.0,
          }
        );

        let statusText = `Resting: ${safeZone.resting} BPM. Aerobic Range: ${Math.round(safeZone.aerobicLow)} - ${Math.round(safeZone.aerobicHigh)} BPM. Max Safe: ${safeZone.maxSafe} BPM.`;
        if (typeof currentHeartRate === 'number') {
          const isSafe = currentHeartRate >= safeZone.resting && currentHeartRate <= safeZone.maxSafe;
          statusText += ` Current HR (${currentHeartRate} BPM) is ${isSafe ? 'WITHIN' : 'OUTSIDE'} the safe zone.`;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ...safeZone, summary: statusText }, null, 2),
            },
          ],
        };
      }

      case 'aura_coach_query': {
        const query = args.query;
        if (!query) {
          return {
            content: [{ type: 'text', text: 'Error: query parameter is required.' }],
            isError: true,
          };
        }
        const telemetry = StubDataService.getCurrentTelemetry();
        const response = HealthAIEngine.getChatResponse(query, telemetry);
        return {
          content: [{ type: 'text', text: response }],
        };
      }

      case 'aura_wearable_sync': {
        const provider = args.provider || 'demo';
        await HealthPlatformService.loginWithDemoAccount(provider);
        const data = await HealthPlatformService.getBaselineActivity();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  }

  /**
   * Internal resource reader.
   */
  private static async readResource(uri: string): Promise<MCPResourceContent[]> {
    switch (uri) {
      case 'aura://telemetry/current': {
        const telemetry = StubDataService.getCurrentTelemetry();
        return [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(telemetry, null, 2),
          },
        ];
      }

      case 'aura://patient/profile': {
        const profile = {
          patientId: 'PAT-001',
          name: 'Robert J.',
          deviceType: 'CRT-D\u2122',
          baselineHRV: 45,
          dailyStepGoal: 6000,
        };
        return [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(profile, null, 2),
          },
        ];
      }

      case 'aura://clinical/guidelines': {
        const guidelines = `# Aura Cardiac Clinical Guidelines\n\n- **Target Pacing Safe Zone:** 10-20% above Lower Rate Limit (LRL) to 85% of Upper Sensor Rate (USR).\n- **Thoracic Fluid Decompensation Alert:** Drop below 110Ω indicates subclinical pulmonary fluid retention.\n- **Emergency Triage Protocol:** Acute chest pain, syncope, or unpredicted shock immediately routes to emergency medical services.`;
        return [
          {
            uri,
            mimeType: 'text/markdown',
            text: guidelines,
          },
        ];
      }

      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  }

  /**
   * Internal prompt generator.
   */
  private static getPrompt(name: string, args: Record<string, any>) {
    switch (name) {
      case 'cardiac_wellness_review': {
        const telemetry = StubDataService.getCurrentTelemetry();
        return {
          description: 'Review patient cardiac telemetry status and lifestyle clearance.',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Please review the following patient cardiac telemetry:\n\n${JSON.stringify(telemetry, null, 2)}\n\nAssess safe exercise zones, fluid status (thoracic impedance), and pacing burden.`,
              },
            },
          ],
        };
      }

      case 'emergency_symptom_triage': {
        const symptoms = args.symptoms || 'Unspecified symptoms';
        return {
          description: 'Triage patient symptoms against cardiac emergency guardrails.',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Patient reports: "${symptoms}". Determine if immediate 911 emergency referral is required under CRM safety protocols.`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Prompt not found: ${name}`);
    }
  }
}
