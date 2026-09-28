import { SecureMerlinNetService } from './MerlinNetService';
import { SecureBLEService } from './BLEService';

describe('Security & Input Sanitization Tests (Staff STE)', () => {
  describe('Patient ID Sanitization against Injection Attacks', () => {
    const maliciousInputs = [
      { raw: "PAT-001'; DROP TABLE Patients;--", expected: 'PAT-001DROPTABLEPatients--' },
      { raw: '<script>alert("XSS")</script>', expected: 'scriptalertXSSscript' },
      { raw: '../../../etc/passwd', expected: 'etcpasswd' },
      { raw: 'patient$(rm -rf /)', expected: 'patientrm-rf' },
      { raw: 'PAT-123\u0000admin', expected: 'PAT-123admin' },
    ];

    maliciousInputs.forEach(({ raw, expected }) => {
      it(`strips illegal characters from input: ${raw}`, async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await SecureMerlinNetService.getLatestTelemetry(raw);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`patient: ${expected}`)
        );
        consoleSpy.mockRestore();
      });

      it(`sanitizes patientId in getPacingParameters: ${raw}`, async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await SecureMerlinNetService.getPacingParameters(raw);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`patient: ${expected}`)
        );
        consoleSpy.mockRestore();
      });
    });

    it('falls back to ANONYMOUS when patient ID is empty or whitespace', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await SecureMerlinNetService.getLatestTelemetry('');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('patient: ANONYMOUS')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Medical Guardrail Value Clamping', () => {
    it('clamps all telemetry fields within physiological safety limits', async () => {
      const telemetry = await SecureMerlinNetService.getLatestTelemetry('VALID-ID-1');

      // Heart rate guardrail: 30 to 220 BPM
      expect(telemetry.heartRate).toBeGreaterThanOrEqual(30);
      expect(telemetry.heartRate).toBeLessThanOrEqual(220);

      // Pacing percentage: 0 to 100%
      expect(telemetry.pacingPercentage).toBeGreaterThanOrEqual(0);
      expect(telemetry.pacingPercentage).toBeLessThanOrEqual(100);

      // Thoracic impedance: 20 to 200 ohms
      expect(telemetry.thoracicImpedance).toBeGreaterThanOrEqual(20);
      expect(telemetry.thoracicImpedance).toBeLessThanOrEqual(200);

      // AFib burden: 0 to 1
      expect(telemetry.afBurden).toBeGreaterThanOrEqual(0);
      expect(telemetry.afBurden).toBeLessThanOrEqual(1);
    });

    it('BLE subscription properly tears down timer on unsubscribe', () => {
      jest.useFakeTimers();
      const mockCallback = jest.fn();
      const unsubscribe = SecureBLEService.subscribeToLiveStream(mockCallback);

      // Advance by 3 seconds to trigger at least one interval
      jest.advanceTimersByTime(3000);
      expect(mockCallback).toHaveBeenCalled();

      const callCount = mockCallback.mock.calls.length;
      unsubscribe();

      // Advance by another 10 seconds, no new callbacks should occur
      jest.advanceTimersByTime(10000);
      expect(mockCallback.mock.calls.length).toBe(callCount);

      jest.useRealTimers();
    });
  });
});
