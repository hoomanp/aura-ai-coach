import { CardiacTelemetry, PacingParameters, ChatMessage } from '../models/health';

export interface DemoState {
  isConnected: boolean;
  skipConsent: boolean;
  preloadedChatMessages: ChatMessage[];
}

export class StubDataService {
  static isDemoMode(): boolean {
    return process.env.APP_ENV === 'demo';
  }

  static getDemoState(): DemoState {
    return {
      isConnected: true,
      skipConsent: true,
      preloadedChatMessages: [
        {
          id: 'demo-1',
          sender: 'ai',
          text: 'Good morning, Robert! Your heart readings look great today. Your pacing is at 12.5% and fluid levels are normal.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'demo-2',
          sender: 'user',
          text: 'Can I exercise today?',
          timestamp: new Date(Date.now() - 240000).toISOString(),
        },
        {
          id: 'demo-3',
          sender: 'ai',
          text: "Yes! Your heart rate is comfortably within your safe zone. A 20-minute walk is a great idea — you're clear for light aerobic activity.",
          timestamp: new Date(Date.now() - 180000).toISOString(),
        },
      ],
    };
  }

  static generateHistory(): CardiacTelemetry[] {
    const heartRates  = [72, 74, 71, 75, 73, 76, 74];
    const pacingPcts  = [11.5, 12.0, 13.5, 12.5, 11.0, 14.0, 12.5];
    const impedances  = [123, 125, 122, 126, 124, 125, 125];
    const afBurdens   = [0.1, 0.0, 0.2, 0.1, 0.0, 0.1, 0.1];

    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(8, 0, 0, 0);
      return {
        timestamp: date.toISOString(),
        heartRate: heartRates[i],
        pacingPercentage: pacingPcts[i],
        thoracicImpedance: impedances[i],
        afBurden: afBurdens[i],
        batteryStatus: 'Good' as const,
      };
    });
  }

  static getCurrentTelemetry(): CardiacTelemetry {
    return {
      timestamp: new Date().toISOString(),
      heartRate: 74,
      pacingPercentage: 12.5,
      thoracicImpedance: 125,
      afBurden: 0.1,
      batteryStatus: 'Good',
    };
  }

  static getDemoPacingParameters(): PacingParameters {
    return {
      lowerRateLimit: 60,
      upperSensorRate: 140,
      atrialSensitivity: 2.5,
      ventricularSensitivity: 2.0,
    };
  }
}
