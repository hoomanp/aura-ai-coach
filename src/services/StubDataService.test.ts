import { StubDataService } from './StubDataService';

describe('StubDataService', () => {
  describe('generateHistory', () => {
    it('returns exactly 7 days of telemetry', () => {
      const history = StubDataService.generateHistory();
      expect(history).toHaveLength(7);
    });

    it('produces heart rate values within medical guardrails', () => {
      const history = StubDataService.generateHistory();
      history.forEach(t => {
        expect(t.heartRate).toBeGreaterThanOrEqual(30);
        expect(t.heartRate).toBeLessThanOrEqual(220);
      });
    });

    it('produces pacing percentage values 0-100', () => {
      const history = StubDataService.generateHistory();
      history.forEach(t => {
        expect(t.pacingPercentage).toBeGreaterThanOrEqual(0);
        expect(t.pacingPercentage).toBeLessThanOrEqual(100);
      });
    });

    it('produces thoracic impedance within range', () => {
      const history = StubDataService.generateHistory();
      history.forEach(t => {
        expect(t.thoracicImpedance).toBeGreaterThanOrEqual(20);
        expect(t.thoracicImpedance).toBeLessThanOrEqual(200);
      });
    });

    it('returns deterministic results across calls', () => {
      const first = StubDataService.generateHistory();
      const second = StubDataService.generateHistory();
      expect(first.map(t => t.heartRate)).toEqual(second.map(t => t.heartRate));
      expect(first.map(t => t.timestamp.slice(0, 10))).toEqual(second.map(t => t.timestamp.slice(0, 10)));
    });

    it('returns entries sorted oldest to newest', () => {
      const history = StubDataService.generateHistory();
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp > history[i - 1].timestamp).toBe(true);
      }
    });
  });

  describe('getCurrentTelemetry', () => {
    it('returns heart rate of 74', () => {
      expect(StubDataService.getCurrentTelemetry().heartRate).toBe(74);
    });

    it('returns Good battery status', () => {
      expect(StubDataService.getCurrentTelemetry().batteryStatus).toBe('Good');
    });
  });

  describe('getDemoState', () => {
    it('returns 3 preloaded chat messages', () => {
      expect(StubDataService.getDemoState().preloadedChatMessages).toHaveLength(3);
    });

    it('starts with an AI message', () => {
      expect(StubDataService.getDemoState().preloadedChatMessages[0].sender).toBe('ai');
    });

    it('has a user message second', () => {
      expect(StubDataService.getDemoState().preloadedChatMessages[1].sender).toBe('user');
    });

    it('has skipConsent true', () => {
      expect(StubDataService.getDemoState().skipConsent).toBe(true);
    });

    it('has isConnected true', () => {
      expect(StubDataService.getDemoState().isConnected).toBe(true);
    });
  });

  describe('isDemoMode', () => {
    const originalEnv = process.env.APP_ENV;
    afterEach(() => { process.env.APP_ENV = originalEnv; });

    it('returns true when APP_ENV is demo', () => {
      process.env.APP_ENV = 'demo';
      expect(StubDataService.isDemoMode()).toBe(true);
    });

    it('returns false when APP_ENV is not demo', () => {
      process.env.APP_ENV = 'production';
      expect(StubDataService.isDemoMode()).toBe(false);
    });
  });
});
