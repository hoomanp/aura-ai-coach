export interface CardiacTelemetry {
  timestamp: string;
  heartRate: number; // BPM
  pacingPercentage: number; // 0-100
  thoracicImpedance: number; // Ohms (indicator of fluid buildup)
  afBurden: number; // Percentage of time in AFib
  batteryStatus: 'Good' | 'Recommended Replacement' | 'Elective Replacement Indicator';
}

export interface PacingParameters {
  lowerRateLimit: number;
  upperSensorRate: number;
  atrialSensitivity: number;
  ventricularSensitivity: number;
}

export interface UserHealthProfile {
  name: string;
  deviceType: 'Pacemaker™' | 'ICD™' | 'CRT-D™' | 'Pacemaker' | 'ICD' | 'CRT-D';
  baselineHRV: number;
  dailyStepGoal: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export type AuthProvider = 'apple' | 'google' | 'demo';

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  provider: AuthProvider;
  platform: 'ios' | 'android' | 'web';
  healthPlatformConnected: boolean;
  connectedAt?: string;
}

export interface PlatformHealthData {
  steps: number;
  heartRate: number;
  source: 'Apple HealthKit' | 'Google Health Connect' | 'Simulated Platform';
  syncedAt: string;
}

