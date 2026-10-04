import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ActivityIndicator,
  TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, LegalStrings } from '../theme/Theme';
import { SecureMerlinNetService } from '../services/MerlinNetService';
import { SecureBLEService } from '../services/BLEService';
import { HealthPlatformService } from '../services/HealthPlatformService';
import { HealthAIEngine } from '../ai/HealthAIEngine';
import { ConsentModal } from '../components/ConsentModal';
import { HealthAccountModal } from '../components/HealthAccountModal';
import { StubDataService } from '../services/StubDataService';
import {
  CardiacTelemetry, PacingParameters, UserHealthProfile,
  UserAccount, PlatformHealthData,
} from '../models/health';

const PatientProfile: UserHealthProfile = {
  name: 'Robert J.',
  deviceType: 'CRT-D\u2122',
  baselineHRV: 45,
  dailyStepGoal: 6000,
};

export function DashboardScreen() {
  const isDemo = StubDataService.isDemoMode();
  const demoTelemetry = isDemo ? StubDataService.getCurrentTelemetry() : null;
  const demoPacingParams = isDemo ? StubDataService.getDemoPacingParameters() : null;

  const [loading, setLoading] = useState(!isDemo);
  const [isBleConnected, setIsBleConnected] = useState(isDemo);
  const [telemetry, setTelemetry] = useState<CardiacTelemetry | null>(demoTelemetry);
  const [pacingParams, setPacingParams] = useState<PacingParameters | null>(demoPacingParams);
  const [insight, setInsight] = useState(
    demoTelemetry ? HealthAIEngine.generateCoachingInsight(demoTelemetry, PatientProfile) : ''
  );
  const [healthAlert, setHealthAlert] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{
    title: string;
    description: string;
    onAllow: () => void;
  } | null>(null);

  // Authentication & Health Platform Sync State
  const [userAccount, setUserAccount] = useState<UserAccount | null>(HealthPlatformService.getCurrentUser());
  const [platformHealthData, setPlatformHealthData] = useState<PlatformHealthData | null>(null);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);

  const [blePermissionGranted, setBlePermissionGranted] = useState(isDemo);
  const healthPermissionGranted = userAccount?.healthPlatformConnected ?? false;

  const platformInfo = HealthPlatformService.getPlatformInfo();
  const isIOS = Platform.OS === 'ios';

  const syncAura = useCallback(async () => {
    if (!blePermissionGranted) {
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

      const coachingInsight = HealthAIEngine.generateCoachingInsight(latestTelemetry, PatientProfile);

      if (healthPermissionGranted) {
        const platformData = await HealthPlatformService.getBaselineActivity();
        setPlatformHealthData(platformData);
        const verificationAlert = HealthAIEngine.crossVerifyHeartRate(
          latestTelemetry.heartRate,
          platformData.heartRate,
        );
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
      title: 'Connect to Your Abbott\u00AE Device',
      description:
        'Aura AI requires Bluetooth access to securely sync with your pacemaker. This allows real-time heart health monitoring and personalized AI guidance.',
      onAllow: () => {
        setBlePermissionGranted(true);
        setModalContent(null);
      },
    });
  };

  const handleOpenAccountModal = () => {
    setIsAccountModalVisible(true);
  };

  const handleAccountLoginSuccess = async (account: UserAccount) => {
    setUserAccount(account);
    const data = await HealthPlatformService.getBaselineActivity();
    setPlatformHealthData(data);

    if (telemetry) {
      const verificationAlert = HealthAIEngine.crossVerifyHeartRate(
        telemetry.heartRate,
        data.heartRate,
      );
      setHealthAlert(verificationAlert);
    }
  };

  const handleDisconnectHealth = () => {
    HealthPlatformService.disconnectHealthPlatform();
    setUserAccount(prev => (prev ? { ...prev, healthPlatformConnected: false } : null));
    setPlatformHealthData(null);
    setHealthAlert(null);
  };

  useEffect(() => {
    if (isDemo) return;
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={Typography.caption}>Aura AI for Abbott®</Text>
            <Text style={Typography.h1}>{userAccount?.displayName ?? PatientProfile.name}</Text>
          </View>
          <View style={styles.connectionBadgeContainer}>
            <View style={[styles.statusDot, { backgroundColor: isBleConnected ? Colors.success : Colors.danger }]} />
            <View style={styles.deviceBadge}>
              <Text style={styles.deviceBadgeText}>{PatientProfile.deviceType}</Text>
            </View>
          </View>
        </View>

        {healthAlert && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>{healthAlert}</Text>
            <TouchableOpacity onPress={() => setHealthAlert(null)}>
              <Text style={styles.alertClose}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Live Telemetry Ring */}
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

        {/* AI Insight Card */}
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Aura AI Guidance</Text>
          <Text style={styles.insightBody}>{insight}</Text>

          {!isDemo && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.primary, marginTop: Spacing.m }]}
              onPress={syncAura}
            >
              <Text style={styles.actionButtonText}>Sync myMerlinPulse™ Device</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Platform Health Integration & User Account Card */}
        <View style={styles.healthIntegrationCard}>
          <View style={styles.healthIntegrationHeader}>
            <Ionicons
              name={
                userAccount?.provider === 'apple' || isIOS
                  ? 'heart-circle'
                  : 'fitness'
              }
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.healthIntegrationTitle}>
              {platformInfo.serviceName}
            </Text>
          </View>

          {userAccount && userAccount.healthPlatformConnected ? (
            <View style={styles.connectedContainer}>
              <View style={styles.accountRow}>
                <Ionicons
                  name={userAccount.provider === 'apple' ? 'logo-apple' : 'logo-google'}
                  size={18}
                  color={Colors.text}
                />
                <Text style={styles.accountEmail}>
                  Logged in as {userAccount.email}
                </Text>
              </View>

              <View style={styles.syncStatusRow}>
                <View style={styles.syncedPill}>
                  <Text style={styles.syncedPillText}>
                    {userAccount.provider === 'apple' ? 'Apple Health Synced' : 'Health Connect Synced'}
                  </Text>
                </View>
                {platformHealthData && (
                  <Text style={styles.metricsSummary}>
                    {platformHealthData.steps.toLocaleString()} steps • {platformHealthData.heartRate} BPM
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnectHealth}>
                <Text style={styles.disconnectButtonText}>Disconnect Health Sync</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.unconnectedContainer}>
              <Text style={styles.healthIntegrationDescription}>
                {isIOS
                  ? `Sign in with your ${platformInfo.providerName} to enable bidirectional ${platformInfo.serviceName} sync and cross-verify your heart rate.`
                  : `Sign in with your ${platformInfo.providerName} to connect ${platformInfo.serviceName} and verify CRM metrics against wearable data.`}
              </Text>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  { backgroundColor: isIOS ? '#000' : Colors.primary },
                ]}
                onPress={handleOpenAccountModal}
              >
                <Ionicons
                  name={isIOS ? 'logo-apple' : 'logo-google'}
                  size={18}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.connectButtonText}>
                  {isIOS ? 'Sign in with Apple to Connect' : 'Sign in with Google to Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
            <Text style={[Typography.h2, { color: Colors.success }]}>{telemetry.batteryStatus}</Text>
          </View>
        </View>

        {/* Footer & Legal Disclaimers */}
        <View style={styles.footer}>
          <Text style={styles.legalNotice}>{LegalStrings.trademarkNotice}</Text>
          <Text style={styles.disclaimerText}>{LegalStrings.disclaimer}</Text>
          <Text style={styles.copyrightText}>{LegalStrings.copyright}</Text>
        </View>

      </ScrollView>

      {/* Permission Consent Modal */}
      <ConsentModal
        isVisible={!!modalContent}
        title={modalContent?.title ?? ''}
        description={modalContent?.description ?? ''}
        onAllow={() => modalContent?.onAllow()}
        onDeny={() => setModalContent(null)}
      />

      {/* User Login & Health Authentication Modal */}
      <HealthAccountModal
        isVisible={isAccountModalVisible}
        onClose={() => setIsAccountModalVisible(false)}
        onSuccess={handleAccountLoginSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.m },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.m, color: Colors.textSecondary, ...Typography.body },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  connectionBadgeContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.s },
  deviceBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, borderRadius: 20 },
  deviceBadgeText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12 },
  auraRingContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  ringOuter: {
    width: 220, height: 220, borderRadius: 110, borderWidth: 10,
    justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card,
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  hrValue: { fontSize: 54, fontWeight: 'bold', color: Colors.text },
  hrUnit: { fontSize: 18, color: Colors.textSecondary, fontWeight: '600' },
  zoneGuide: { marginTop: Spacing.m, backgroundColor: '#F1F3F5', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, borderRadius: 12 },
  zoneText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  insightCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: Spacing.l, marginBottom: Spacing.l,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    borderLeftWidth: 6, borderLeftColor: Colors.primary,
  },
  insightTitle: { ...Typography.h2, marginBottom: Spacing.s, color: Colors.primary },
  insightBody: { ...Typography.body, lineHeight: 24, color: Colors.text },
  alertBanner: {
    backgroundColor: '#FFF3CD', padding: Spacing.m, borderRadius: 12, marginBottom: Spacing.m,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFEEBA',
  },
  alertText: { color: '#856404', fontSize: 13, flex: 1, marginRight: Spacing.s },
  alertClose: { color: '#856404', fontWeight: 'bold', fontSize: 12 },
  healthIntegrationCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.m,
    marginBottom: Spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  healthIntegrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.s,
  },
  healthIntegrationTitle: {
    ...Typography.h2,
    fontSize: 16,
    color: Colors.text,
  },
  healthIntegrationDescription: {
    ...Typography.caption,
    lineHeight: 18,
    marginBottom: Spacing.m,
  },
  connectedContainer: {
    gap: Spacing.s,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountEmail: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  syncedPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncedPillText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  metricsSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  disconnectButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  disconnectButtonText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  unconnectedContainer: {
    gap: Spacing.xs,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: Spacing.s,
  },
  connectButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  actionButton: { paddingVertical: Spacing.m, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  statBox: { backgroundColor: Colors.card, width: '30%', padding: Spacing.m, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  footer: { paddingTop: Spacing.l, paddingBottom: Spacing.xl, borderTopWidth: 1, borderTopColor: '#EEE', marginTop: Spacing.m },
  legalNotice: { ...Typography.legal, marginBottom: Spacing.s, fontWeight: 'bold' },
  disclaimerText: { ...Typography.legal, marginBottom: Spacing.s, lineHeight: 16 },
  copyrightText: { ...Typography.legal, fontSize: 10 },
});
