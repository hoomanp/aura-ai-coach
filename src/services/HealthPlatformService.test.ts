import { Platform } from 'react-native';
import { HealthPlatformService } from './HealthPlatformService';

describe('HealthPlatformService - Apple Health & Health Connect Ecosystem Tests', () => {
  beforeEach(async () => {
    // Teardown any session between tests
    await HealthPlatformService.logout();
  });

  describe('Platform Discovery & Metadata', () => {
    it('returns appropriate platform info based on runtime environment', () => {
      const info = HealthPlatformService.getPlatformInfo();
      expect(info).toBeDefined();
      expect(typeof info.serviceName).toBe('string');
      expect(typeof info.providerName).toBe('string');
      expect(typeof info.isAvailable).toBe('boolean');
    });
  });

  describe('Authentication Gate: Login with Apple ID (iOS)', () => {
    it('logs in user via Apple ID with initial healthPlatformConnected as false', async () => {
      const user = await HealthPlatformService.loginWithApple('john.doe@icloud.com', 'John Doe');

      expect(user).toBeDefined();
      expect(user.email).toBe('john.doe@icloud.com');
      expect(user.displayName).toBe('John Doe');
      expect(user.provider).toBe('apple');
      expect(user.platform).toBe('ios');
      expect(user.healthPlatformConnected).toBe(false);

      // Verify currentUser session matches
      const current = HealthPlatformService.getCurrentUser();
      expect(current).toEqual(user);
    });
  });

  describe('Authentication Gate: Login with Google Account (Android)', () => {
    it('logs in user via Google Account with initial healthPlatformConnected as false', async () => {
      const user = await HealthPlatformService.loginWithGoogle('jane.smith@gmail.com', 'Jane Smith');

      expect(user).toBeDefined();
      expect(user.email).toBe('jane.smith@gmail.com');
      expect(user.displayName).toBe('Jane Smith');
      expect(user.provider).toBe('google');
      expect(user.platform).toBe('android');
      expect(user.healthPlatformConnected).toBe(false);

      // Verify currentUser session matches
      const current = HealthPlatformService.getCurrentUser();
      expect(current).toEqual(user);
    });
  });

  describe('Health Authorization Security Gate', () => {
    it('strictly REJECTS health permission request if user is not authenticated', async () => {
      expect(HealthPlatformService.getCurrentUser()).toBeNull();

      const result = await HealthPlatformService.requestPermissions();
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Please log in to your .* before connecting/);
    });

    it('approves Apple HealthKit permission request once Apple user is logged in', async () => {
      await HealthPlatformService.loginWithApple('robert.j@icloud.com');
      const result = await HealthPlatformService.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      const user = HealthPlatformService.getCurrentUser();
      expect(user?.healthPlatformConnected).toBe(true);
    });

    it('approves Health Connect permission request once Google user is logged in', async () => {
      await HealthPlatformService.loginWithGoogle('robert.j@gmail.com');
      const result = await HealthPlatformService.requestPermissions();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      const user = HealthPlatformService.getCurrentUser();
      expect(user?.healthPlatformConnected).toBe(true);
    });
  });

  describe('Disconnect and Logout Session Lifecycle', () => {
    it('disconnects health platform without terminating the user authentication session', async () => {
      await HealthPlatformService.loginWithApple('user@icloud.com');
      await HealthPlatformService.requestPermissions();
      expect(HealthPlatformService.getCurrentUser()?.healthPlatformConnected).toBe(true);

      HealthPlatformService.disconnectHealthPlatform();
      const user = HealthPlatformService.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.healthPlatformConnected).toBe(false);
    });

    it('clears all session state on user logout', async () => {
      await HealthPlatformService.loginWithGoogle('user@gmail.com');
      await HealthPlatformService.requestPermissions();

      await HealthPlatformService.logout();
      expect(HealthPlatformService.getCurrentUser()).toBeNull();
    });
  });

  describe('Wearable Baseline Activity & Cross-Verification', () => {
    it('returns fallback baseline when user is not authenticated or connected', async () => {
      const data = await HealthPlatformService.getBaselineActivity();
      expect(data.source).toBe('Simulated Platform');
      expect(data.steps).toBeGreaterThan(0);
      expect(data.heartRate).toBeGreaterThan(0);
    });

    it('returns Apple HealthKit verified data when Apple account is connected', async () => {
      await HealthPlatformService.loginWithApple('pat@icloud.com');
      await HealthPlatformService.requestPermissions();

      const data = await HealthPlatformService.getBaselineActivity();
      expect(data.source).toBe('Apple HealthKit');
      expect(data.steps).toBe(4500);
      expect(data.heartRate).toBe(73);
      expect(data.syncedAt).toBeDefined();
    });

    it('returns Google Health Connect verified data when Google account is connected', async () => {
      // Force non-iOS platform mock
      const originalOS = Platform.OS;
      try {
        (Platform as { OS: string }).OS = 'android';
        await HealthPlatformService.loginWithGoogle('pat@gmail.com');
        await HealthPlatformService.requestPermissions();

        const data = await HealthPlatformService.getBaselineActivity();
        expect(data.source).toBe('Google Health Connect');
        expect(data.steps).toBe(4500);
        expect(data.heartRate).toBe(73);
      } finally {
        (Platform as { OS: string }).OS = originalOS;
      }
    });
  });

  describe('Demo QA Login Mode', () => {
    it('provides instant pre-authenticated state for rapid automated testing', async () => {
      const demoUser = await HealthPlatformService.loginWithDemoAccount('apple');
      expect(demoUser.healthPlatformConnected).toBe(true);
      expect(demoUser.provider).toBe('apple');
      expect(demoUser.platform).toBe('ios');
    });
  });
});
