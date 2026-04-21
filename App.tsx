import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Colors, Spacing, Typography, LegalStrings } from './src/theme/Theme';
import { SecureMerlinNetService } from './src/services/MerlinNetService';
import { SecureBLEService } from './src/services/BLEService';
import { HealthPlatformService } from './src/services/HealthPlatformService';
import { HealthAIEngine } from './src/ai/HealthAIEngine';
import { ConsentModal } from './src/components/ConsentModal';
import { CardiacTelemetry, PacingParameters, UserHealthProfile } from './src/models/health';

const PatientProfile: UserHealthProfile = {
  name: 'Robert J.',
  deviceType: 'CRT-D™', // Registered trademark
  baselineHRV: 45,
  dailyStepGoal: 6000,
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isBleConnected, setIsBleConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<CardiacTelemetry | null>(null);
  const [pacingParams, setPacingParams] = useState<PacingParameters | null>(null);
  const [insight, setInsight] = useState('');
  const [healthAlert, setHealthAlert] = useState<string | null>(null);

  // New state for explicit consent management
  const [modalContent, setModalContent] = useState<{ title: string; description: string; onAllow: () => void; } | null>(null);
  const [blePermissionGranted, setBlePermissionGranted] = useState(false);
  const [healthPermissionGranted, setHealthPermissionGranted] = useState(false);

  const syncAura = useCallback(async () => {
    if (!blePermissionGranted) {
      // Don't sync if Bluetooth permission isn't granted
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const isSecure = await SecureBLEService.secureConnect('ABBOTT-CRM-X');
      setIsBleConnected(isSecure);

      const [latestTelemetry, params] = await Promise.all([
        SecureMerlinNetService.getLatestTelemetry('PAT-001'),
        SecureMerlinNetService.getPacingParameters('PAT-001'),
      ]);
      
      setTelemetry(latestTelemetry);
      setPacingParams(params);
      
      let coachingInsight = HealthAIEngine.generateCoachingInsight(latestTelemetry, PatientProfile);
      
      if (healthPermissionGranted) {
        const platformData = await HealthPlatformService.getBaselineActivity();
        const verificationAlert = HealthAIEngine.crossVerifyHeartRate(latestTelemetry.heartRate, platformData.heartRate);
        setHealthAlert(verificationAlert);
      }

      setInsight(coachingInsight);

    } catch (error) {
      if (__DEV__) console.error('[Aura] Sync Failure Encountered', error);
      setIsBleConnected(false);
    } finally {
      setLoading(false);
    }
  }, [blePermissionGranted, healthPermissionGranted]);

  const requestBlePermission = () => {
    setModalContent({
      title: 'Connect to Your Abbott® Device',
      description: 'Aura AI requires Bluetooth access to securely sync with your pacemaker. This allows for real-time heart health monitoring and personalized AI guidance.',
      onAllow: () => {
        setBlePermissionGranted(true);
        setModalContent(null);
      },
    });
  };
  
  const requestHealthPermission = () => {
    setModalContent({
      title: 'Connect Your Health Platforms',
      description: `Syncing with Apple Health or Google Health allows Aura AI to cross-verify your heart data for enhanced safety and provide more accurate insights.`,
      onAllow: async () => {
        setModalContent(null);
        const granted = await HealthPlatformService.requestPermissions();
        if (granted) {
          setHealthPermissionGranted(true);
        }
      },
    });
  };

  useEffect(() => {
    if (!blePermissionGranted) {
      requestBlePermission();
    } else {
      syncAura();
    }
  }, [blePermissionGranted]);

  useEffect(() => {
    if (!blePermissionGranted) return;

    const unsubscribe = SecureBLEService.subscribeToLiveStream((liveUpdate) => {
      setTelemetry(prev => (prev ? { ...prev, ...liveUpdate } : null));
    });
    return () => unsubscribe();
  }, [blePermissionGranted]);

  if (loading || !telemetry || !pacingParams) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Syncing Merlin.net™ Data...</Text>
      </View>
    );
  }

  const zones = HealthAIEngine.calculateSafeZone(telemetry, pacingParams);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header - Abbott® Branded */}
        <View style={styles.header}>
          <View>
            <Text style={Typography.caption}>Aura AI for Abbott®</Text>
            <Text style={Typography.h1}>{PatientProfile.name}</Text>
          </View>
          <View style={styles.connectionBadgeContainer}>
            <View style={[styles.statusDot, { backgroundColor: isBleConnected ? Colors.success : Colors.danger }]} />
            <View style={styles.deviceBadge}>
              <Text style={styles.deviceBadgeText}>{PatientProfile.deviceType}</Text>
            </View>
          </View>
        </View>

        {/* Health Alert (if any) */}
        {healthAlert && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>{healthAlert}</Text>
            <TouchableOpacity onPress={() => setHealthAlert(null)}>
              <Text style={styles.alertClose}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Aura Wellness Ring */}
        <View style={styles.auraRingContainer}>
          <View style={[styles.ringOuter, { borderColor: isBleConnected ? Colors.primary : Colors.textSecondary }]}>
            <Text style={styles.hrValue}>{telemetry.heartRate}</Text>
            <Text style={styles.hrUnit}>BPM</Text>
            <Text style={Typography.caption}>{isBleConnected ? 'Secured Live Sync' : 'Reconnecting...'}</Text>
          </View>
          <View style={styles.zoneGuide}>
            <Text style={styles.zoneText}>Heart Zone optimized for {PatientProfile.deviceType}</Text>
          </View>
        </View>

        {/* AI Coaching Card */}
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Aura AI Guidance</Text>
          <Text style={styles.insightBody}>{insight}</Text>
          
          {!healthPermissionGranted ? (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: Colors.secondary, marginTop: Spacing.m }]} 
              onPress={requestHealthPermission}
            >
              <Text style={styles.actionButtonText}>Connect Apple Health & Google Health</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.syncedBadge}>
              <Text style={styles.syncedText}>✓ Health Platforms Synced</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: Colors.primary, marginTop: Spacing.s }]} 
            onPress={syncAura}
          >
            <Text style={styles.actionButtonText}>Sync myMerlinPulse™ Device</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={Typography.caption}>Pacing</Text>
            <Text style={Typography.h2}>{telemetry.pacingPercentage}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={Typography.caption}>Fluid (Imp)</Text>
            <Text style={Typography.h2}>{telemetry.thoracicImpedance}Ω</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={Typography.caption}>Battery</Text>
            <Text style={[Typography.h2, { color: Colors.success }]}>Normal</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.legalNotice}>{LegalStrings.trademarkNotice}</Text>
          <Text style={styles.disclaimerText}>{LegalStrings.disclaimer}</Text>
          <Text style={styles.copyrightText}>{LegalStrings.copyright}</Text>
        </View>

      </ScrollView>

      {/* Explicit Consent Modal */}
      <ConsentModal
        isVisible={!!modalContent}
        title={modalContent?.title ?? ''}
        description={modalContent?.description ?? ''}
        onAllow={() => modalContent?.onAllow()}
        onDeny={() => setModalContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.m,
    color: Colors.textSecondary,
    ...Typography.body,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  connectionBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.s,
  },
  deviceBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
  },
  deviceBadgeText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  auraRingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ringOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  hrValue: {
    fontSize: 54,
    fontWeight: 'bold',
    color: Colors.text,
  },
  hrUnit: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  zoneGuide: {
    marginTop: Spacing.m,
    backgroundColor: '#F1F3F5',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 12,
  },
  zoneText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.l,
    marginBottom: Spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 6,
    borderLeftColor: Colors.primary,
  },
  insightTitle: {
    ...Typography.h2,
    marginBottom: Spacing.s,
    color: Colors.primary,
  },
  insightBody: {
    ...Typography.body,
    lineHeight: 24,
    color: Colors.text,
  },
  alertBanner: {
    backgroundColor: '#FFF3CD',
    padding: Spacing.m,
    borderRadius: 12,
    marginBottom: Spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEEBA',
  },
  alertText: {
    color: '#856404',
    fontSize: 13,
    flex: 1,
    marginRight: Spacing.s,
  },
  alertClose: {
    color: '#856404',
    fontWeight: 'bold',
    fontSize: 12,
  },
  syncedBadge: {
    backgroundColor: '#E8F5E9',
    padding: Spacing.s,
    borderRadius: 8,
    marginTop: Spacing.m,
    alignItems: 'center',
  },
  syncedText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 12,
  },
  actionButton: {
    marginTop: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  statBox: {
    backgroundColor: Colors.card,
    width: '30%',
    padding: Spacing.m,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  footer: {
    paddingTop: Spacing.l,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    marginTop: Spacing.m,
  },
  legalNotice: {
    ...Typography.legal,
    marginBottom: Spacing.s,
    fontWeight: 'bold',
  },
  disclaimerText: {
    ...Typography.legal,
    marginBottom: Spacing.s,
    lineHeight: 16,
  },
  copyrightText: {
    ...Typography.legal,
    fontSize: 10,
  },
});
