import { TrendChart, ChartDataPoint } from './TrendChart';
import { extractAllText, findByType } from '../test-utils/render-helper';
import { Colors } from '../theme/Theme';

describe('TrendChart Component (Telemetry Analytics Visualization)', () => {
  const sampleData: ChartDataPoint[] = [
    { x: 'Mon', y: 72 },
    { x: 'Tue', y: 75 },
    { x: 'Wed', y: 88 },
    { x: 'Thu', y: 110 },
  ];

  it('renders chart header title, subtitle, and line series', () => {
    const tree = TrendChart({
      title: '7-Day Heart Rate',
      subtitle: 'Resting & active heart rate (BPM)',
      data: sampleData,
      type: 'line',
      color: Colors.primary,
    });

    expect(tree).toBeDefined();
    const textContent = extractAllText(tree);
    expect(textContent).toContain('7-Day Heart Rate');
    expect(textContent).toContain('Resting & active heart rate (BPM)');

    const lineNodes = findByType(tree, 'VictoryLine');
    expect(lineNodes.length).toBe(1);
    expect(lineNodes[0].props.data).toEqual(sampleData);
  });

  it('renders area chart series when type is area', () => {
    const tree = TrendChart({
      title: 'Fluid Impedance Trend',
      subtitle: 'Thoracic impedance (Ω)',
      data: sampleData,
      type: 'area',
      color: '#4CAF50',
    });

    const areaNodes = findByType(tree, 'VictoryArea');
    expect(areaNodes.length).toBe(1);
    expect(areaNodes[0].props.data).toEqual(sampleData);
  });

  it('renders bar chart series with danger threshold color switching', () => {
    const tree = TrendChart({
      title: 'Pacing Percentage',
      subtitle: 'Daily ventricular pacing burden (%)',
      data: sampleData,
      type: 'bar',
      color: '#007AFF',
      dangerThreshold: 100, // Wed (88) is normal, Thu (110) triggers danger
    });

    const barNodes = findByType(tree, 'VictoryBar');
    expect(barNodes.length).toBe(1);

    const fillFn = barNodes[0].props.style?.data?.fill;
    expect(typeof fillFn).toBe('function');

    // Test normal value below threshold
    expect(fillFn({ datum: { x: 'Wed', y: 88 } })).toBe('#007AFF');

    // Test alert value exceeding danger threshold
    expect(fillFn({ datum: { x: 'Thu', y: 110 } })).toBe(Colors.danger);
  });
});
