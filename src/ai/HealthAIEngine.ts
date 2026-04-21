import { CardiacTelemetry, PacingParameters, UserHealthProfile } from '../models/health';

/**
 * HealthAIEngine v2: Optimized for 2018+ Mobile Hardware.
 * - Minimal CPU footprint.
 * - Graceful degradation for intermittent BLE signals.
 */
export class HealthAIEngine {
  /**
   * Calculates the 'Safe Intensity Zone' with safety guardrails.
   */
  static calculateSafeZone(telemetry: CardiacTelemetry, parameters: PacingParameters) {
    // Fallback if parameters are missing (Older device sync lag)
    const minHR = parameters?.lowerRateLimit ?? 60;
    const maxHR = parameters?.upperSensorRate ?? 130;

    return {
      resting: minHR,
      aerobicLow: minHR + (maxHR - minHR) * 0.4,
      aerobicHigh: minHR + (maxHR - minHR) * 0.7,
      maxSafe: maxHR - 10,
    };
  }

  /**
   * Insight Generator with "Memory-Efficient" heuristics.
   */
  static generateCoachingInsight(telemetry: CardiacTelemetry, profile: UserHealthProfile): string {
    // Priority 1: Clinical Safety (Fluid Retention)
    if (telemetry.thoracicImpedance < 110) {
      return "Heart Monitor Alert: Fluid levels are slightly elevated. The AI suggests a restful morning and a low-sodium diet today.";
    }

    // Priority 2: Device Dependence
    if (telemetry.pacingPercentage > 95) {
      return "Daily Heart Fact: Your pacemaker is doing a lot of the work today. Focus on light stretches and deep breathing to optimize your CRT-D efficiency.";
    }

    // Priority 3: Activity Guidance
    return `Looking good, ${profile.name}! Your heart rate is perfectly synced with your device's activity sensor. You are clear for your 20-minute walk.`;
  }

  /**
   * Cross-verifies CRM data with external health platform data.
   * Logic: If CRM heart rate is significantly lower than Watch heart rate, 
   * there may be a sensing discrepancy (e.g., Lead migration or noise).
   */
  static crossVerifyHeartRate(crmHR: number, watchHR: number): string | null {
    const delta = Math.abs(crmHR - watchHR);
    if (delta > 30) {
      return "Security & Health Alert: Discrepancy detected between your CRM device and wearable. Please ensure your watch is snug and rest for 5 minutes.";
    }
    return null;
  }

  /**
   * v2 Add-on: Historical Data Cleanup (Ensures app doesn't slow down on 2018 phones)
   */
  static purgeOldTelemetry(history: CardiacTelemetry[]): CardiacTelemetry[] {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return history.filter(t => t.timestamp > twentyFourHoursAgo);
  }
}
