import { SecureBLEService } from './BLEService';
import { Platform } from 'react-native';

describe('SecureBLEService (Encrypted Telemetry Stream & Medical Guardrails)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('performs TLS-over-BLE challenge-response handshake', async () => {
    const isConnected = await SecureBLEService.secureConnect('ABBOTT-CRM-X');
    expect(isConnected).toBe(true);
  });

  it('subscribes to live stream and delivers physiologically clamped heart rate', () => {
    const onTelemetry = jest.fn();
    const unsubscribe = SecureBLEService.subscribeToLiveStream(onTelemetry);

    expect(typeof unsubscribe).toBe('function');
    expect(onTelemetry).not.toHaveBeenCalled();

    // Advance timer past poll interval (2000ms on iOS)
    jest.advanceTimersByTime(2000);
    expect(onTelemetry).toHaveBeenCalledTimes(1);

    const firstCall = onTelemetry.mock.calls[0][0];
    expect(firstCall.heartRate).toBeGreaterThanOrEqual(30);
    expect(firstCall.heartRate).toBeLessThanOrEqual(220);
    expect(firstCall.timestamp).toBeDefined();

    // Advance for second tick
    jest.advanceTimersByTime(2000);
    expect(onTelemetry).toHaveBeenCalledTimes(2);

    // Teardown subscription
    unsubscribe();

    // Ensure no more callbacks after unsubscribe
    jest.advanceTimersByTime(4000);
    expect(onTelemetry).toHaveBeenCalledTimes(2);
  });

  it('adjusts polling interval for Android scheduling', () => {
    const originalOS = Platform.OS;
    try {
      (Platform as { OS: string }).OS = 'android';
      const onTelemetry = jest.fn();
      const unsubscribe = SecureBLEService.subscribeToLiveStream(onTelemetry);

      // On Android, interval is 2500ms
      jest.advanceTimersByTime(2000);
      expect(onTelemetry).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(onTelemetry).toHaveBeenCalledTimes(1);

      unsubscribe();
    } finally {
      (Platform as { OS: string }).OS = originalOS;
    }
  });
});
