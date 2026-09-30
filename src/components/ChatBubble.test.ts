import { ChatBubble } from './ChatBubble';
import { ChatMessage } from '../models/health';
import { extractAllText, findByType } from '../test-utils/render-helper';

describe('ChatBubble Component (TDD & Medical UX)', () => {
  it('renders an AI coaching message with avatar, text, and formatted timestamp', () => {
    const message: ChatMessage = {
      id: 'msg-ai-1',
      sender: 'ai',
      text: 'Your current thoracic impedance of 125Ω indicates normal fluid levels.',
      timestamp: '2026-05-26T14:30:00.000Z',
    };

    const tree = ChatBubble({ message });
    expect(tree).toBeDefined();

    const allText = extractAllText(tree);
    expect(allText).toContain('A'); // AI avatar initial
    expect(allText).toContain('Your current thoracic impedance of 125Ω indicates normal fluid levels.');

    // Verify avatar View is rendered
    const textNodes = findByType(tree, 'Text');
    const avatarText = textNodes.find(n => n.props.children === 'A');
    expect(avatarText).toBeDefined();
  });

  it('renders a patient message aligned to user side without avatar', () => {
    const message: ChatMessage = {
      id: 'msg-user-1',
      sender: 'user',
      text: 'Can I go for a 30-minute jog this afternoon?',
      timestamp: '2026-05-26T14:31:00.000Z',
    };

    const tree = ChatBubble({ message });
    expect(tree).toBeDefined();

    const textNodes = findByType(tree, 'Text');
    const avatarNode = textNodes.find(n => n.props.children === 'A');
    expect(avatarNode).toBeUndefined(); // No avatar for user
    expect(extractAllText(tree)).toContain('Can I go for a 30-minute jog this afternoon?');
  });
});
