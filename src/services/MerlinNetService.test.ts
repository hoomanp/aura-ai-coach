import { SecureMerlinNetService } from './MerlinNetService';

describe('SecureMerlinNetService (HL7 FHIR & Remote Gateway)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches sanitized telemetry with clinical schema bounds', async () => {
    const promise = SecureMerlinNetService.getLatestTelemetry('PATIENT-001');
    jest.advanceTimersByTime(500);
    const telemetry = await promise;

    expect(telemetry).toBeDefined();
    expect(telemetry.heartRate).toBeGreaterThanOrEqual(30);
    expect(telemetry.heartRate).toBeLessThanOrEqual(220);
    expect(telemetry.pacingPercentage).toBeGreaterThanOrEqual(0);
    expect(telemetry.pacingPercentage).toBeLessThanOrEqual(100);
    expect(telemetry.thoracicImpedance).toBeGreaterThanOrEqual(20);
    expect(telemetry.thoracicImpedance).toBeLessThanOrEqual(200);
    expect(telemetry.batteryStatus).toBe('Good');
  });

  it('handles empty patient id by safely falling back to ANONYMOUS', async () => {
    const promise = SecureMerlinNetService.getLatestTelemetry('');
    jest.advanceTimersByTime(500);
    const telemetry = await promise;
    expect(telemetry).toBeDefined();
  });

  it('fetches pacing parameters with programmed rate limits', async () => {
    const promise = SecureMerlinNetService.getPacingParameters('PATIENT-001');
    jest.advanceTimersByTime(400);
    const params = await promise;

    expect(params).toBeDefined();
    expect(params.lowerRateLimit).toBe(60);
    expect(params.upperSensorRate).toBe(140);
    expect(params.atrialSensitivity).toBe(2.5);
    expect(params.ventricularSensitivity).toBe(2.0);
  });
});
