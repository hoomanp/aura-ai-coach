import { AICoachScreen } from './AICoachScreen';
import { extractAllText, findByType, setupMockHooks, restoreMockHooks } from '../test-utils/render-helper';

describe('AICoachScreen (Interactive AI Coach & Clinical Chat)', () => {
  beforeEach(() => {
    setupMockHooks();
  });

  afterEach(() => {
    restoreMockHooks();
  });

  it('renders coach header, clinical care reminders, and quick reply chips', () => {
    const tree = AICoachScreen();
    expect(tree).toBeDefined();

    const textContent = extractAllText(tree);

    // Coach header
    expect(textContent).toContain('Aura AI Coach');
    expect(textContent).toContain('Merlin.net');

    // Quick prompt suggestion chips
    expect(textContent).toContain('How is my pacing?');
    expect(textContent).toContain('Is my fluid normal?');
    expect(textContent).toContain('Can I exercise today?');

    // Input area
    const inputNodes = findByType(tree, 'TextInput');
    expect(inputNodes.length).toBe(1);
    expect(inputNodes[0].props.placeholder).toContain('Ask Aura');

    // Verify Send button exists
    expect(textContent).toContain('Send');

    // Verify ReminderCard component is integrated
    const reminderCards = findByType(tree, 'ReminderCard');
    expect(reminderCards.length).toBe(1);
  });

  it('renders preloaded clinical chat history in demo mode', () => {
    process.env.APP_ENV = 'demo';
    const tree = AICoachScreen();
    expect(tree).toBeDefined();

    const chatBubbles = findByType(tree, 'ChatBubble');
    expect(chatBubbles.length).toBeGreaterThan(0);

    delete process.env.APP_ENV;
  });
});
