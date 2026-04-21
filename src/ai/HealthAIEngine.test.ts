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

describe('HealthAIEngine.getChatResponse', () => {
  const baseTelemetry: CardiacTelemetry = {
    timestamp: '2026-04-21T10:00:00Z',
    heartRate: 74,
    pacingPercentage: 12.5,
    thoracicImpedance: 125,
    afBurden: 0.1,
    batteryStatus: 'Good',
  };

  it('responds to "pacing" keyword with current pacing percentage', () => {
    const response = HealthAIEngine.getChatResponse('How is my pacing?', baseTelemetry);
    expect(response).toContain('12.5');
    expect(response.toLowerCase()).toContain('pacing');
  });

  it('responds to "pacemaker" keyword', () => {
    const response = HealthAIEngine.getChatResponse('Tell me about my pacemaker', baseTelemetry);
    expect(response.toLowerCase()).toContain('pacing');
  });

  it('responds to "fluid" keyword with normal impedance message', () => {
    const response = HealthAIEngine.getChatResponse('Is my fluid normal?', baseTelemetry);
    expect(response).toContain('125');
    expect(response.toLowerCase()).toContain('normal');
  });

  it('responds to "fluid" keyword with elevated impedance warning', () => {
    const elevated = { ...baseTelemetry, thoracicImpedance: 95 };
    const response = HealthAIEngine.getChatResponse('fluid levels', elevated);
    expect(response.toLowerCase()).toContain('elevated');
  });

  it('responds to "heart rate" keyword with current BPM', () => {
    const response = HealthAIEngine.getChatResponse('What is my heart rate?', baseTelemetry);
    expect(response).toContain('74');
  });

  it('responds to "bpm" keyword', () => {
    const response = HealthAIEngine.getChatResponse('check my bpm', baseTelemetry);
    expect(response).toContain('74');
  });

  it('responds to "battery" keyword with battery status', () => {
    const response = HealthAIEngine.getChatResponse('How is the battery?', baseTelemetry);
    expect(response).toContain('Good');
  });

  it('responds to "walk" keyword with activity guidance', () => {
    const response = HealthAIEngine.getChatResponse('Can I go for a walk?', baseTelemetry);
    expect(response.length).toBeGreaterThan(10);
  });

  it('responds to "exercise" keyword', () => {
    const response = HealthAIEngine.getChatResponse('Can I exercise today?', baseTelemetry);
    expect(response.length).toBeGreaterThan(10);
  });

  it('returns fallback for unrecognized input', () => {
    const response = HealthAIEngine.getChatResponse('What is the weather like?', baseTelemetry);
    expect(response).toContain('care team');
  });

  it('is case-insensitive', () => {
    const upper = HealthAIEngine.getChatResponse('PACING', baseTelemetry);
    const lower = HealthAIEngine.getChatResponse('pacing', baseTelemetry);
    expect(upper).toBe(lower);
  });
});
