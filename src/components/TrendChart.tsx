import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryArea,
  VictoryAxis,
  VictoryVoronoiContainer,
  VictoryTooltip,
} from 'victory-native';
import type { CallbackArgs } from 'victory-core';
import { Colors, Spacing, Typography } from '../theme/Theme';

export interface ChartDataPoint {
  x: string;
  y: number;
}

interface TrendChartProps {
  title: string;
  subtitle: string;
  data: ChartDataPoint[];
  type: 'line' | 'area' | 'bar';
  color?: string;
  /** Bar color switches to Colors.danger when a bar's y value exceeds this threshold */
  dangerThreshold?: number;
}

export function TrendChart({
  title,
  subtitle,
  data,
  type,
  color = Colors.primary,
  dangerThreshold,
}: TrendChartProps) {
  const renderSeries = () => {
    if (type === 'bar') {
      return (
        <VictoryBar
          data={data}
          style={{
            data: {
              fill: ({ datum }: CallbackArgs) =>
                dangerThreshold !== undefined &&
                datum !== undefined &&
                (datum as ChartDataPoint).y > dangerThreshold
                  ? Colors.danger
                  : color,
            },
          }}
        />
      );
    }
    if (type === 'area') {
      return (
        <VictoryArea
          data={data}
          style={{
            data: { fill: color, fillOpacity: 0.25, stroke: color, strokeWidth: 2 },
          }}
        />
      );
    }
    // line (default)
    return (
      <VictoryLine
        data={data}
        style={{ data: { stroke: color, strokeWidth: 2 } }}
        labels={({ datum }: { datum: ChartDataPoint }) => String(datum.y)}
        labelComponent={<VictoryTooltip />}
      />
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <VictoryChart
        containerComponent={<VictoryVoronoiContainer />}
        padding={{ top: 24, bottom: 44, left: 50, right: 16 }}
        height={200}
      >
        <VictoryAxis
          tickFormat={(t: string) => t.slice(5)}
          style={{ tickLabels: { fontSize: 10, fill: Colors.textSecondary } }}
        />
        <VictoryAxis
          dependentAxis
          style={{ tickLabels: { fontSize: 10, fill: Colors.textSecondary } }}
        />
        {renderSeries()}
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.m,
    marginBottom: Spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  title: { ...Typography.h2, color: Colors.primary, marginBottom: 4 },
  subtitle: { ...Typography.caption, marginBottom: Spacing.s },
});
