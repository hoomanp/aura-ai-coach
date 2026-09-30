import { ConsentModal } from './ConsentModal';
import { extractAllText, findByType } from '../test-utils/render-helper';

describe('ConsentModal Component (Zero-Trust Privacy Gate)', () => {
  it('renders modal with title, description, and action buttons when visible', () => {
    const onAllow = jest.fn();
    const onDeny = jest.fn();

    const tree = ConsentModal({
      isVisible: true,
      title: 'Authorize Health Sync',
      description: 'Aura AI needs permission to read heart rate and steps for CRM cross-verification.',
      onAllow,
      onDeny,
    });

    expect(tree).toBeDefined();

    // Verify Modal component props
    const modalNodes = findByType(tree, 'Modal');
    expect(modalNodes.length).toBe(1);
    expect(modalNodes[0].props.visible).toBe(true);
    expect(modalNodes[0].props.transparent).toBe(true);

    // Verify Title and Description text
    const textContent = extractAllText(tree);
    expect(textContent).toContain('Authorize Health Sync');
    expect(textContent).toContain('Aura AI needs permission to read heart rate and steps');
    expect(textContent).toContain('Deny');
    expect(textContent).toContain('Allow');

    // Test button handlers
    const touchables = findByType(tree, 'TouchableOpacity');
    expect(touchables.length).toBe(2);

    // Deny button (first touchable)
    touchables[0].props.onPress();
    expect(onDeny).toHaveBeenCalledTimes(1);

    // Allow button (second touchable)
    touchables[1].props.onPress();
    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it('passes isVisible=false when hidden', () => {
    const tree = ConsentModal({
      isVisible: false,
      title: 'Hidden Dialog',
      description: 'This is hidden',
      onAllow: jest.fn(),
      onDeny: jest.fn(),
    });

    const modalNodes = findByType(tree, 'Modal');
    expect(modalNodes[0].props.visible).toBe(false);
  });
});
