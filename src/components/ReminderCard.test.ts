import React from 'react';
import { ReminderCard } from './ReminderCard';
import { extractAllText, findByType } from '../test-utils/render-helper';

describe('ReminderCard Component (Cardiac Care Reminders)', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementation((initial: any) => {
      const val = typeof initial === 'function' ? initial() : initial;
      return [val, jest.fn()];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('renders reminder card with initial clinical reminders', () => {
    const tree = ReminderCard();
    expect(tree).toBeDefined();

    const textContent = extractAllText(tree);
    expect(textContent).toContain('Reminders');
    expect(textContent).toContain('Device Check Appointment');
    expect(textContent).toContain('Next Tuesday at 2:00 PM');
    expect(textContent).toContain('Merlin.net Nightly Sync');
    expect(textContent).toContain('Daily at 9:00 PM');
    expect(textContent).toContain('Low Sodium Diet Goal');
    expect(textContent).toContain('+ Add');

    // 1 Add button + 3 reminder rows = 4 touchables
    const touchables = findByType(tree, 'TouchableOpacity');
    expect(touchables.length).toBe(4);
  });

  it('allows tapping a reminder to toggle completion status', () => {
    const tree = ReminderCard();
    const touchables = findByType(tree, 'TouchableOpacity');

    // Row 1 is touchables[1] (touchables[0] is + Add)
    const firstRow = touchables[1];
    expect(firstRow).toBeDefined();

    // Verify toggle function executes without error
    expect(() => firstRow.props.onPress()).not.toThrow();
  });
});
