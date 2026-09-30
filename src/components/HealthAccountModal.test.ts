import { Platform } from 'react-native';
import { HealthAccountModal } from './HealthAccountModal';
import { HealthPlatformService } from '../services/HealthPlatformService';
import { extractAllText, findByType, setupMockHooks, restoreMockHooks } from '../test-utils/render-helper';

describe('HealthAccountModal Component (Ecosystem Identity Authentication)', () => {
  beforeEach(async () => {
    setupMockHooks();
    await HealthPlatformService.logout();
  });

  afterEach(() => {
    restoreMockHooks();
  });

  it('renders modal with iOS Apple Sign-in primary option on iOS', () => {
    const originalOS = Platform.OS;
    try {
      (Platform as { OS: string }).OS = 'ios';
      const tree = HealthAccountModal({
        isVisible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      });

      expect(tree).toBeDefined();
      const textContent = extractAllText(tree);
      expect(textContent).toContain('Connect Your Health Account');
      expect(textContent).toContain('Sign in with Apple');
      expect(textContent).toContain('Or use Google Account');
      expect(textContent).toContain('Cancel');
    } finally {
      (Platform as { OS: string }).OS = originalOS;
    }
  });

  it('renders modal with Google Account primary option on Android', () => {
    const originalOS = Platform.OS;
    try {
      (Platform as { OS: string }).OS = 'android';
      const tree = HealthAccountModal({
        isVisible: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      });

      expect(tree).toBeDefined();
      const textContent = extractAllText(tree);
      expect(textContent).toContain('Connect Your Health Account');
      expect(textContent).toContain('Sign in with Google');
      expect(textContent).toContain('Or use Apple ID');
    } finally {
      (Platform as { OS: string }).OS = originalOS;
    }
  });

  it('triggers Apple sign-in workflow on primary button press on iOS', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    const tree = HealthAccountModal({
      isVisible: true,
      onClose,
      onSuccess,
    });

    const touchables = findByType(tree, 'TouchableOpacity');
    // First touchable is Apple login button on iOS
    const appleBtn = touchables[0];
    expect(appleBtn).toBeDefined();

    // Trigger login
    await appleBtn.props.onPress();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    const user = HealthPlatformService.getCurrentUser();
    expect(user?.provider).toBe('apple');
    expect(user?.healthPlatformConnected).toBe(true);
  });

  it('triggers cancel button to close modal', () => {
    const onClose = jest.fn();
    const tree = HealthAccountModal({
      isVisible: true,
      onClose,
      onSuccess: jest.fn(),
    });

    const touchables = findByType(tree, 'TouchableOpacity');
    // Last touchable is Cancel button
    const cancelBtn = touchables[touchables.length - 1];
    cancelBtn.props.onPress();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
