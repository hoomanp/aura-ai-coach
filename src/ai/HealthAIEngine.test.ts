import { HealthAIEngine } from './HealthAIEngine';
import { CardiacTelemetry, PacingParameters, UserHealthProfile } from '../models/health';

describe('HealthAIEngine', () => {
  const mockProfile: UserHealthProfile = {
    name: 'Robert J.',
    deviceType: 'CRT-D™',
    baselineHRV: 45,
    dailyStepGoal: 6000,
  };

  const mockParams: PacingParameters = {
    lowerRateLimit: 60,
    upperSensorRate: 140,
    atrialSensitivity: 2.5,
    ventricularSensitivity: 2.0,
  };

  const mockTelemetry: CardiacTelemetry = {
    timestamp: new Date().toISOString(),
    heartRate: 75,
    pacingPercentage: 12.5,
    thoracicImpedance: 125,
    afBurden: 0.1,
    batteryStatus: 'Good',
  };

  test('calculateSafeZone returns correct ranges', () => {
    const zones = HealthAIEngine.calculateSafeZone(mockTelemetry, mockParams);
    expect(zones.resting).toBe(60);
    expect(zones.aerobicLow).toBe(60 + (140 - 60) * 0.4);
    expect(zones.aerobicHigh).toBe(60 + (140 - 60) * 0.7);
    expect(zones.maxSafe).toBe(140 - 10);
  });

  test('generateCoachingInsight returns fluid retention alert when impedance is low', () => {
    const lowImpedanceTelemetry = { ...mockTelemetry, thoracicImpedance: 100 };
    const insight = HealthAIEngine.generateCoachingInsight(lowImpedanceTelemetry, mockProfile);
    expect(insight).toContain('Fluid levels are slightly elevated');
  });

  test('generateCoachingInsight returns pacing alert when pacing is high', () => {
    const highPacingTelemetry = { ...mockTelemetry, pacingPercentage: 96 };
    const insight = HealthAIEngine.generateCoachingInsight(highPacingTelemetry, mockProfile);
    expect(insight).toContain('Your pacemaker is doing a lot of the work today');
  });

  test('generateCoachingInsight returns generic greeting for normal data', () => {
    const insight = HealthAIEngine.generateCoachingInsight(mockTelemetry, mockProfile);
    expect(insight).toContain(`Looking good, ${mockProfile.name}`);
  });

  test('crossVerifyHeartRate returns alert for large discrepancy', () => {
    const alert = HealthAIEngine.crossVerifyHeartRate(70, 110);
    expect(alert).toContain('Discrepancy detected between your CRM device and wearable');
  });

  test('crossVerifyHeartRate returns null for small discrepancy', () => {
    const alert = HealthAIEngine.crossVerifyHeartRate(70, 80);
    expect(alert).toBeNull();
  });
});
