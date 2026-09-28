import { HealthAIEngine } from './HealthAIEngine';
import { CardiacTelemetry, UserHealthProfile } from '../models/health';

describe('HealthAIEngine — Emergency & Safety Guardrail Tests (Staff STE)', () => {
  const sampleTelemetry: CardiacTelemetry = {
    timestamp: new Date().toISOString(),
    heartRate: 72,
    pacingPercentage: 15.0,
    thoracicImpedance: 125,
    afBurden: 0.1,
    batteryStatus: 'Good',
  };

  const sampleProfile: UserHealthProfile = {
    name: 'Robert J.',
    deviceType: 'CRT-D',
    baselineHRV: 45,
    dailyStepGoal: 6000,
  };

  describe('Clinical Emergency Detection in Chat', () => {
    const emergencyQueries = [
      'I am feeling severe chest pain right now',
      'I have sudden shortness of breath',
      'My ICD just gave me a shock!',
      'I felt dizzy and almost passed out',
      'I think I am having a heart attack',
      'I had a faint episode this morning',
    ];

    emergencyQueries.forEach(query => {
      it(`triggers emergency safety alert for query: "${query}"`, () => {
        const response = HealthAIEngine.getChatResponse(query, sampleTelemetry);
        expect(response).toContain('EMERGENCY SAFETY ALERT');
        expect(response).toContain('call 911');
      });
    });

    it('prioritizes emergency triage even when device keywords are present in the same query', () => {
      const mixedQuery = 'My pacemaker is pacing but I have crushing chest pain';
      const response = HealthAIEngine.getChatResponse(mixedQuery, sampleTelemetry);
      expect(response).toContain('EMERGENCY SAFETY ALERT');
      expect(response).not.toContain('heart is doing most of the work');
    });
  });

  describe('Edge-case Inputs & Robustness', () => {
    it('handles empty message gracefully without throwing', () => {
      const response = HealthAIEngine.getChatResponse('', sampleTelemetry);
      expect(response).toContain('Hello! I am Aura AI Coach');
    });

    it('handles whitespace-only message gracefully', () => {
      const response = HealthAIEngine.getChatResponse('   \t\n  ', sampleTelemetry);
      expect(response).toContain('Hello! I am Aura AI Coach');
    });

    it('handles extremely long message without ReDoS or buffer issues', () => {
      const longMessage = 'heart rate '.repeat(500);
      const response = HealthAIEngine.getChatResponse(longMessage, sampleTelemetry);
      expect(response).toContain('Your current heart rate is 72 BPM');
    });
  });

  describe('Physiological Boundary Tests for Coaching Insights', () => {
    it('handles severe fluid retention (impedance < 110 ohms)', () => {
      const criticalTelemetry = { ...sampleTelemetry, thoracicImpedance: 85 };
      const insight = HealthAIEngine.generateCoachingInsight(criticalTelemetry, sampleProfile);
      expect(insight).toContain('Fluid levels are slightly elevated');
      expect(insight).toContain('low-sodium diet');
    });

    it('handles severe pacing dependence (pacing > 95%)', () => {
      const heavyPacing = { ...sampleTelemetry, pacingPercentage: 99.0 };
      const insight = HealthAIEngine.generateCoachingInsight(heavyPacing, sampleProfile);
      expect(insight).toContain('pacemaker is doing a lot of the work today');
    });

    it('handles normal activity clearance when values are within healthy limits', () => {
      const insight = HealthAIEngine.generateCoachingInsight(sampleTelemetry, sampleProfile);
      expect(insight).toContain('Looking good, Robert J.!');
      expect(insight).toContain('clear for your 20-minute walk');
    });
  });
});
