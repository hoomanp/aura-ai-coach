import App from '../App';
import { findByType, setupMockHooks, restoreMockHooks } from './test-utils/render-helper';
import { DashboardScreen } from './screens/DashboardScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { AICoachScreen } from './screens/AICoachScreen';

describe('App Root Component (Navigation & Tab Architecture)', () => {
  beforeEach(() => {
    setupMockHooks();
  });

  afterEach(() => {
    restoreMockHooks();
  });

  it('configures bottom tab navigation with Dashboard, History, and AI Coach screens', () => {
    const tree = App();
    expect(tree).toBeDefined();

    // Verify NavigationContainer wrapper
    const navContainers = findByType(tree, 'NavigationContainer');
    expect(navContainers.length).toBe(1);

    // Verify Tab Screens
    const tabScreens = findByType(tree, 'TabScreen');
    expect(tabScreens.length).toBe(3);

    const names = tabScreens.map(s => s.props.name);
    expect(names).toContain('Dashboard');
    expect(names).toContain('History');
    expect(names).toContain('AI Coach');

    // Verify Screen component bindings
    const dashboardTab = tabScreens.find(s => s.props.name === 'Dashboard');
    expect(dashboardTab.props.component).toBe(DashboardScreen);

    const historyTab = tabScreens.find(s => s.props.name === 'History');
    expect(historyTab.props.component).toBe(HistoryScreen);

    const aiCoachTab = tabScreens.find(s => s.props.name === 'AI Coach');
    expect(aiCoachTab.props.component).toBe(AICoachScreen);
  });
});
