import { HistoryScreen } from './HistoryScreen';
import { extractAllText, findByType, setupMockHooks, restoreMockHooks } from '../test-utils/render-helper';

describe('HistoryScreen (7-Day Cardiac Telemetry Analytics)', () => {
  beforeEach(() => {
    setupMockHooks();
  });

  afterEach(() => {
    restoreMockHooks();
  });

  it('renders 7-day history header and 3 trend chart visualizations', () => {
    const tree = HistoryScreen();
    expect(tree).toBeDefined();

    const textContent = extractAllText(tree);

    // Screen Header
    expect(textContent).toContain('7-Day History');
    expect(textContent).toContain('Abbott');

    // TrendChart components (Heart Rate, Pacing %, AFib Burden)
    const chartNodes = findByType(tree, 'TrendChart');
    expect(chartNodes.length).toBe(3);

    // Verify Heart Rate chart props
    const hrChart = chartNodes.find(c => c.props.title === 'Heart Rate');
    expect(hrChart).toBeDefined();
    expect(hrChart.props.type).toBe('line');
    expect(hrChart.props.data.length).toBe(7);

    // Verify Pacing chart props
    const pacingChart = chartNodes.find(c => c.props.title === 'Pacing %');
    expect(pacingChart).toBeDefined();
    expect(pacingChart.props.type).toBe('area');

    // Verify AFib Burden chart props
    const afChart = chartNodes.find(c => c.props.title === 'AFib Burden');
    expect(afChart).toBeDefined();
    expect(afChart.props.type).toBe('bar');
    expect(afChart.props.dangerThreshold).toBe(5);
  });
});
