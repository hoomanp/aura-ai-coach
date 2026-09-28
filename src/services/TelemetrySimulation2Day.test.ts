import { HealthAIEngine } from '../ai/HealthAIEngine';
import { CardiacTelemetry, PacingParameters, UserHealthProfile } from '../models/health';

describe('Staff STE — 2-Day (48-Hour) Continuous Telemetry Simulation & Validation', () => {
  const profile: UserHealthProfile = {
    name: 'Robert J.',
    deviceType: 'CRT-D',
    baselineHRV: 45,
    dailyStepGoal: 6000,
  };

  const pacingParams: PacingParameters = {
    lowerRateLimit: 60,
    upperSensorRate: 140,
    atrialSensitivity: 2.5,
    ventricularSensitivity: 2.0,
  };

  /**
   * Generates a 48-hour continuous sequence of hourly telemetry readings.
   * Simulates realistic circadian patterns:
   * - Day 1: Healthy baseline with natural diurnal HR fluctuations (60 BPM resting at night to 85 BPM during day)
   * - Day 2: Gradual thoracic impedance decline (125 -> 105 ohms) to test fluid retention alerts
   */
  function generate48HourTelemetryTimeline(startDate: Date): CardiacTelemetry[] {
    const timeline: CardiacTelemetry[] = [];

    for (let hour = 0; hour < 48; hour++) {
      const timestamp = new Date(startDate.getTime() + hour * 3600 * 1000);
      const hourOfDay = timestamp.getHours();

      // Circadian baseline: lower at 02:00-06:00 (~60 bpm), higher during waking hours (~75-85 bpm)
      const isNight = hourOfDay >= 23 || hourOfDay < 6;
      const diurnalHR = isNight ? 60 + (hour % 3) : 72 + (hour % 12);

      // Impedance: stable on Day 1 (~125 ohms), drops on Day 2 to simulate subclinical fluid retention
      const isDayTwo = hour >= 24;
      const impedance = isDayTwo
        ? Math.max(100, 125 - Math.floor((hour - 24) * 1.1)) // Drops below 110 threshold
        : 125 + (hour % 3);

      // Pacing %: higher at night when intrinsic conduction slows down
      const pacing = isNight ? 25.0 : 12.0;

      timeline.push({
        timestamp: timestamp.toISOString(),
        heartRate: diurnalHR,
        pacingPercentage: pacing,
        thoracicImpedance: impedance,
        afBurden: hour === 14 || hour === 38 ? 0.05 : 0.0,
        batteryStatus: 'Good',
      });
    }

    return timeline;
  }

  const baseDate = new Date('2026-09-01T00:00:00.000Z');
  const fullTimeline = generate48HourTelemetryTimeline(baseDate);

  test('48-hour timeline produces exactly 48 hourly sequential data points', () => {
    expect(fullTimeline).toHaveLength(48);
    for (let i = 1; i < fullTimeline.length; i++) {
      const prev = new Date(fullTimeline[i - 1].timestamp).getTime();
      const curr = new Date(fullTimeline[i].timestamp).getTime();
      expect(curr - prev).toBe(3600 * 1000); // exactly 1 hour step
    }
  });

  test('Day 1 telemetry maintains normal non-elevated fluid status', () => {
    const dayOne = fullTimeline.slice(0, 24);
    dayOne.forEach((reading) => {
      expect(reading.thoracicImpedance).toBeGreaterThanOrEqual(110);
      const insight = HealthAIEngine.generateCoachingInsight(reading, profile);
      expect(insight).toContain('Looking good, Robert J.!');
      expect(insight).not.toContain('Fluid levels are slightly elevated');
    });
  });

  test('Day 2 progressive impedance decline reliably triggers fluid retention warning', () => {
    const dayTwo = fullTimeline.slice(24, 48);
    const elevatedAlertReadings = dayTwo.filter(r => r.thoracicImpedance < 110);
    expect(elevatedAlertReadings.length).toBeGreaterThan(0);

    elevatedAlertReadings.forEach(reading => {
      const insight = HealthAIEngine.generateCoachingInsight(reading, profile);
      expect(insight).toContain('Fluid levels are slightly elevated');
      expect(insight).toContain('low-sodium diet');

      const chatResponse = HealthAIEngine.getChatResponse('how is my fluid?', reading);
      expect(chatResponse).toContain('elevated');
    });
  });

  test('calculateSafeZone remains robust across all 48 hours', () => {
    fullTimeline.forEach(reading => {
      const safeZone = HealthAIEngine.calculateSafeZone(reading, pacingParams);
      expect(safeZone.resting).toBe(60);
      expect(safeZone.aerobicLow).toBeGreaterThan(safeZone.resting);
      expect(safeZone.aerobicHigh).toBeGreaterThan(safeZone.aerobicLow);
      expect(safeZone.maxSafe).toBeGreaterThan(safeZone.aerobicHigh);
      expect(safeZone.maxSafe).toBe(130);
    });
  });

  test('purgeOldTelemetry correctly prunes 48-hour history down to rolling 24 hours', () => {
    // Mock current time to end of 48-hour window
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-09-03T00:00:00.000Z').getTime()
    );

    const pruned = HealthAIEngine.purgeOldTelemetry(fullTimeline);
    expect(pruned.length).toBeLessThan(48);
    expect(pruned.length).toBe(23); // Only readings from the past 24 hours

    // All kept readings must be within 24h of simulated now
    const cutoff = new Date('2026-09-02T00:00:00.000Z').toISOString();
    pruned.forEach(item => {
      expect(item.timestamp > cutoff).toBe(true);
    });

    nowSpy.mockRestore();
  });

  test('AI chat responses remain deterministic across diverse 2-day telemetry states', () => {
    fullTimeline.forEach(reading => {
      // Pacing response
      const pacingChat = HealthAIEngine.getChatResponse('pacing', reading);
      expect(pacingChat).toContain(`${reading.pacingPercentage}%`);

      // Heart rate response
      const hrChat = HealthAIEngine.getChatResponse('heart rate', reading);
      expect(hrChat).toContain(`${reading.heartRate} BPM`);

      // Battery response
      const batteryChat = HealthAIEngine.getChatResponse('battery', reading);
      expect(batteryChat).toContain('Good');
    });
  });
});
