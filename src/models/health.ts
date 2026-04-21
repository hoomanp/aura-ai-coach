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
