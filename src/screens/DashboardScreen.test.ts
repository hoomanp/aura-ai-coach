import { DashboardScreen } from './DashboardScreen';
import { extractAllText, findByType, setupMockHooks, restoreMockHooks } from '../test-utils/render-helper';
import { HealthPlatformService } from '../services/HealthPlatformService';

import { SecureBLEService } from '../services/BLEService';

describe('DashboardScreen (Telemetry Dashboard & Clinical Overview)', () => {
  beforeEach(async () => {
    setupMockHooks();
    jest.spyOn(SecureBLEService, 'subscribeToLiveStream').mockReturnValue(jest.fn());
    await HealthPlatformService.logout();
  });

  afterEach(() => {
    restoreMockHooks();
  });

  it('renders loading indicator and sync message during initial data acquisition', () => {
    delete process.env.APP_ENV;
    const tree = DashboardScreen();
    expect(tree).toBeDefined();

    const textContent = extractAllText(tree);
    expect(textContent).toContain('Syncing Merlin.net');
    const spinner = findByType(tree, 'ActivityIndicator');
    expect(spinner.length).toBe(1);
  });

  it('renders live telemetry metrics, safe zone guidance, and health integration in demo mode', () => {
    process.env.APP_ENV = 'demo';
    const tree = DashboardScreen();
    expect(tree).toBeDefined();

    const textContent = extractAllText(tree);

    // Patient & Device Header
    expect(textContent).toContain('Robert J.');
    expect(textContent).toContain('CRT-D');

    // Telemetry & Stats Grid
    expect(textContent).toContain('Pacing');
    expect(textContent).toContain('Fluid (Imp)');
    expect(textContent).toContain('Battery');

    // AI Daily Insight
    expect(textContent).toContain('Aura AI Guidance');

    // Health Platform Integration
    expect(textContent).toContain('Apple Health');

    // Legal & Regulatory Disclaimers
    expect(textContent).toContain('Abbott®');
    expect(textContent).toContain('NOT intended for the diagnosis');

    // Modals
    const consentModals = findByType(tree, 'ConsentModal');
    expect(consentModals.length).toBe(1);
    const healthModals = findByType(tree, 'HealthAccountModal');
    expect(healthModals.length).toBe(1);

    delete process.env.APP_ENV;
  });
});
