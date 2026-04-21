import React, { useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';
import { StubDataService } from '../services/StubDataService';
import { TrendChart, ChartDataPoint } from '../components/TrendChart';
import { CardiacTelemetry } from '../models/health';

function average(values: number[]): number {
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function toChartData(
  history: CardiacTelemetry[],
  key: keyof Pick<CardiacTelemetry, 'heartRate' | 'pacingPercentage' | 'afBurden'>,
): ChartDataPoint[] {
  return history.map(t => ({
    x: t.timestamp.slice(0, 10),
    y: t[key] as number,
  }));
}

export function HistoryScreen() {
  const history = useMemo(() => StubDataService.generateHistory(), []);

  const hrData = toChartData(history, 'heartRate');
  const pacingData = toChartData(history, 'pacingPercentage');
  const afData = toChartData(history, 'afBurden');

  const avgHR = average(history.map(t => t.heartRate));
  const avgPacing = (history.reduce((s, t) => s + t.pacingPercentage, 0) / history.length).toFixed(1);
  const avgAF = (history.reduce((s, t) => s + t.afBurden, 0) / history.length).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={Typography.h1}>7-Day History</Text>
          <Text style={[Typography.caption, { marginTop: 4 }]}>Abbott\u00AE CRM Telemetry</Text>
        </View>

        <TrendChart
          title="Heart Rate"
          subtitle={`Avg ${avgHR} BPM this week`}
          data={hrData}
          type="line"
          color={Colors.primary}
        />
        <TrendChart
          title="Pacing %"
          subtitle={`Avg ${avgPacing}% this week`}
          data={pacingData}
          type="area"
          color={Colors.secondary}
        />
        <TrendChart
          title="AFib Burden"
          subtitle={`Avg ${avgAF}% this week`}
          data={afData}
          type="bar"
          color={Colors.primary}
          dangerThreshold={5}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.m },
  header: { marginBottom: Spacing.xl, paddingTop: 8 },
});
