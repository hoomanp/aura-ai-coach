# Aura AI Coach iOS Demo Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-screen Aura AI Coach prototype into a polished 3-tab iOS demo app (Dashboard / History / AI Coach) with Historical Trends, Reminders, and AI Chat, distributed via TestFlight.

**Architecture:** React Navigation bottom tabs replace App.tsx as the root. All screen logic moves to dedicated `src/screens/` files. New features (charts, chat, reminders) are isolated in focused components. `StubDataService` centralizes all demo/God-Mode data behind an `APP_ENV=demo` flag so production code stays clean.

**Tech Stack:** Expo ~55, React Native 0.83.2, TypeScript (strict), `@react-navigation/native` + `@react-navigation/bottom-tabs`, `victory-native@36` + `react-native-svg`, `@expo/vector-icons` (bundled), Jest + ts-jest

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `App.tsx` | Thin shell: NavigationContainer + Tab.Navigator only |
| Create | `src/screens/DashboardScreen.tsx` | All current App.tsx UI + state logic |
| Create | `src/screens/HistoryScreen.tsx` | 7-day telemetry chart display |
| Create | `src/screens/AICoachScreen.tsx` | Chat interface + Reminders card |
| Create | `src/components/TrendChart.tsx` | Reusable victory-native chart wrapper |
| Create | `src/components/ChatBubble.tsx` | Single chat message bubble |
| Create | `src/components/ReminderCard.tsx` | Reminder list with toggle |
| Create | `src/services/StubDataService.ts` | God Mode state + 7-day history generation |
| Create | `src/services/StubDataService.test.ts` | Tests for StubDataService |
| Modify | `src/ai/HealthAIEngine.ts` | Add `getChatResponse()` static method |
| Modify | `src/ai/HealthAIEngine.test.ts` | Add tests for `getChatResponse()` |
| Modify | `src/models/health.ts` | Add `ChatMessage` interface |
| Modify | `app.json` | Update bundle ID + add HealthKit entitlement |
| Modify | `eas.json` | Add `demo` build profile |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install navigation and chart packages**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/Abbott/aura-ai-coach
npm install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-svg "victory-native@^36.9.2"
```

Expected: packages added to `node_modules`, `package.json` updated with new dependencies.

- [ ] **Step 2: Create src/screens directory**

```bash
mkdir -p src/screens
```

- [ ] **Step 3: Verify installs**

```bash
node -e "require('@react-navigation/native'); require('@react-navigation/bottom-tabs'); require('victory-native'); console.log('OK')"
```

Expected output: `OK`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-navigation and victory-native dependencies"
```

---

## Task 2: Add ChatMessage type to health models

**Files:**
- Modify: `src/models/health.ts`

- [ ] **Step 1: Add ChatMessage interface**

Open `src/models/health.ts` and append at the end of the file:

```typescript
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/models/health.ts
git commit -m "feat: add ChatMessage type to health models"
```

---

## Task 3: StubDataService with tests (TDD)

**Files:**
- Create: `src/services/StubDataService.ts`
- Create: `src/services/StubDataService.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/services/StubDataService.test.ts`:

```typescript
import { StubDataService } from './StubDataService';

describe('StubDataService', () => {
  describe('generateHistory', () => {
    it('returns exactly 7 days of telemetry', () => {
      const history = StubDataService.generateHistory();
      expect(history).toHaveLength(7);
    });

    it('produces heart rate values within medical guardrails', () => {
      const history = StubDataService.generateHistory();
      history.forEach(t => {
        expect(t.heartRate).toBeGreaterThanOrEqual(30);
        expect(t.heartRate).toBeLessThanOrEqual(220);
      });
    });

    it('produces pacing percentage values 0-100', () => {
      const history = StubDataService.generateHistory();
      history.forEach(t => {
        expect(t.pacingPercentage).toBeGreaterThanOrEqual(0);
        expect(t.pacingPercentage).toBeLessThanOrEqual(100);
      });
    });

    it('produces thoracic impedance within range', () => {
      const history = StubDataService.generateHistory();
      history.forEach(t => {
        expect(t.thoracicImpedance).toBeGreaterThanOrEqual(20);
        expect(t.thoracicImpedance).toBeLessThanOrEqual(200);
      });
    });

    it('returns deterministic results across calls', () => {
      const first = StubDataService.generateHistory().map(t => t.heartRate);
      const second = StubDataService.generateHistory().map(t => t.heartRate);
      expect(first).toEqual(second);
    });

    it('returns entries sorted oldest to newest', () => {
      const history = StubDataService.generateHistory();
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp > history[i - 1].timestamp).toBe(true);
      }
    });
  });

  describe('getCurrentTelemetry', () => {
    it('returns heart rate of 74', () => {
      expect(StubDataService.getCurrentTelemetry().heartRate).toBe(74);
    });

    it('returns Good battery status', () => {
      expect(StubDataService.getCurrentTelemetry().batteryStatus).toBe('Good');
    });
  });

  describe('getDemoState', () => {
    it('returns 3 preloaded chat messages', () => {
      expect(StubDataService.getDemoState().preloadedChatMessages).toHaveLength(3);
    });

    it('starts with an AI message', () => {
      expect(StubDataService.getDemoState().preloadedChatMessages[0].sender).toBe('ai');
    });

    it('has a user message second', () => {
      expect(StubDataService.getDemoState().preloadedChatMessages[1].sender).toBe('user');
    });

    it('has skipConsent true', () => {
      expect(StubDataService.getDemoState().skipConsent).toBe(true);
    });

    it('has isConnected true', () => {
      expect(StubDataService.getDemoState().isConnected).toBe(true);
    });
  });

  describe('isDemoMode', () => {
    const originalEnv = process.env.APP_ENV;
    afterEach(() => { process.env.APP_ENV = originalEnv; });

    it('returns true when APP_ENV is demo', () => {
      process.env.APP_ENV = 'demo';
      expect(StubDataService.isDemoMode()).toBe(true);
    });

    it('returns false when APP_ENV is not demo', () => {
      process.env.APP_ENV = 'production';
      expect(StubDataService.isDemoMode()).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/services/StubDataService.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module './StubDataService'`

- [ ] **Step 3: Implement StubDataService**

Create `src/services/StubDataService.ts`:

```typescript
import { CardiacTelemetry, PacingParameters, ChatMessage } from '../models/health';

export interface DemoState {
  isConnected: boolean;
  skipConsent: boolean;
  preloadedChatMessages: ChatMessage[];
}

export class StubDataService {
  static isDemoMode(): boolean {
    return process.env.APP_ENV === 'demo';
  }

  static getDemoState(): DemoState {
    return {
      isConnected: true,
      skipConsent: true,
      preloadedChatMessages: [
        {
          id: 'demo-1',
          sender: 'ai',
          text: 'Good morning, Robert! Your heart readings look great today. Your pacing is at 12.5% and fluid levels are normal.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'demo-2',
          sender: 'user',
          text: 'Can I exercise today?',
          timestamp: new Date(Date.now() - 240000).toISOString(),
        },
        {
          id: 'demo-3',
          sender: 'ai',
          text: "Yes! Your heart rate is comfortably within your safe zone. A 20-minute walk is a great idea — you're clear for light aerobic activity.",
          timestamp: new Date(Date.now() - 180000).toISOString(),
        },
      ],
    };
  }

  static generateHistory(): CardiacTelemetry[] {
    const heartRates      = [72, 74, 71, 75, 73, 76, 74];
    const pacingPcts      = [11.5, 12.0, 13.5, 12.5, 11.0, 14.0, 12.5];
    const impedances      = [123, 125, 122, 126, 124, 125, 125];
    const afBurdens       = [0.1, 0.0, 0.2, 0.1, 0.0, 0.1, 0.1];

    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(8, 0, 0, 0); // Normalize to 8 AM for determinism
      return {
        timestamp: date.toISOString(),
        heartRate: heartRates[i],
        pacingPercentage: pacingPcts[i],
        thoracicImpedance: impedances[i],
        afBurden: afBurdens[i],
        batteryStatus: 'Good' as const,
      };
    });
  }

  static getCurrentTelemetry(): CardiacTelemetry {
    return {
      timestamp: new Date().toISOString(),
      heartRate: 74,
      pacingPercentage: 12.5,
      thoracicImpedance: 125,
      afBurden: 0.1,
      batteryStatus: 'Good',
    };
  }

  static getDemoPacingParameters(): PacingParameters {
    return {
      lowerRateLimit: 60,
      upperSensorRate: 140,
      atrialSensitivity: 2.5,
      ventricularSensitivity: 2.0,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/services/StubDataService.test.ts --no-coverage
```

Expected: PASS — all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/services/StubDataService.ts src/services/StubDataService.test.ts
git commit -m "feat: add StubDataService with God Mode demo state and 7-day history"
```

---

## Task 4: HealthAIEngine — getChatResponse (TDD)

**Files:**
- Modify: `src/ai/HealthAIEngine.ts`
- Modify: `src/ai/HealthAIEngine.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests to `src/ai/HealthAIEngine.test.ts`:

```typescript
import { CardiacTelemetry } from '../models/health';

// Add this describe block after the existing tests
describe('HealthAIEngine.getChatResponse', () => {
  const baseTelemetry: CardiacTelemetry = {
    timestamp: '2026-04-21T10:00:00Z',
    heartRate: 74,
    pacingPercentage: 12.5,
    thoracicImpedance: 125,
    afBurden: 0.1,
    batteryStatus: 'Good',
  };

  it('responds to "pacing" keyword with current pacing percentage', () => {
    const response = HealthAIEngine.getChatResponse('How is my pacing?', baseTelemetry);
    expect(response).toContain('12.5');
    expect(response.toLowerCase()).toContain('pacing');
  });

  it('responds to "pacemaker" keyword', () => {
    const response = HealthAIEngine.getChatResponse('Tell me about my pacemaker', baseTelemetry);
    expect(response.toLowerCase()).toContain('pacing');
  });

  it('responds to "fluid" keyword with normal impedance message', () => {
    const response = HealthAIEngine.getChatResponse('Is my fluid normal?', baseTelemetry);
    expect(response).toContain('125');
    expect(response.toLowerCase()).toContain('normal');
  });

  it('responds to "fluid" keyword with elevated impedance warning', () => {
    const elevated = { ...baseTelemetry, thoracicImpedance: 95 };
    const response = HealthAIEngine.getChatResponse('fluid levels', elevated);
    expect(response.toLowerCase()).toContain('elevated');
  });

  it('responds to "heart rate" keyword with current BPM', () => {
    const response = HealthAIEngine.getChatResponse('What is my heart rate?', baseTelemetry);
    expect(response).toContain('74');
  });

  it('responds to "bpm" keyword', () => {
    const response = HealthAIEngine.getChatResponse('check my bpm', baseTelemetry);
    expect(response).toContain('74');
  });

  it('responds to "battery" keyword with battery status', () => {
    const response = HealthAIEngine.getChatResponse('How is the battery?', baseTelemetry);
    expect(response).toContain('Good');
  });

  it('responds to "walk" keyword with activity guidance', () => {
    const response = HealthAIEngine.getChatResponse('Can I go for a walk?', baseTelemetry);
    expect(response.length).toBeGreaterThan(10);
  });

  it('responds to "exercise" keyword', () => {
    const response = HealthAIEngine.getChatResponse('Can I exercise today?', baseTelemetry);
    expect(response.length).toBeGreaterThan(10);
  });

  it('returns fallback for unrecognized input', () => {
    const response = HealthAIEngine.getChatResponse('What is the weather like?', baseTelemetry);
    expect(response).toContain('care team');
  });

  it('is case-insensitive', () => {
    const upper = HealthAIEngine.getChatResponse('PACING', baseTelemetry);
    const lower = HealthAIEngine.getChatResponse('pacing', baseTelemetry);
    expect(upper).toBe(lower);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx jest src/ai/HealthAIEngine.test.ts --no-coverage
```

Expected: FAIL — `HealthAIEngine.getChatResponse is not a function`

- [ ] **Step 3: Add getChatResponse to HealthAIEngine**

Open `src/ai/HealthAIEngine.ts` and add the following static method inside the `HealthAIEngine` class, after `purgeOldTelemetry`:

```typescript
  /**
   * Stub chat response engine for demo mode.
   * Matches keywords in the patient's message and returns
   * contextual responses using current telemetry values.
   */
  static getChatResponse(message: string, telemetry: CardiacTelemetry): string {
    const msg = message.toLowerCase();

    if (msg.includes('pacing') || msg.includes('pacemaker')) {
      return `Your pacemaker is currently pacing ${telemetry.pacingPercentage}% of your heartbeats. This means your heart is doing most of the work on its own — that is a great sign.`;
    }
    if (msg.includes('fluid') || msg.includes('impedance')) {
      const isNormal = telemetry.thoracicImpedance >= 110;
      return isNormal
        ? `Your fluid levels look normal at ${telemetry.thoracicImpedance}\u03A9. No signs of fluid buildup today.`
        : `Your fluid levels are slightly elevated at ${telemetry.thoracicImpedance}\u03A9. Consider resting and reducing sodium intake today.`;
    }
    if (msg.includes('heart rate') || msg.includes('bpm')) {
      return `Your current heart rate is ${telemetry.heartRate} BPM, which is within your programmed safe zone. Your device is monitoring every beat.`;
    }
    if (msg.includes('battery')) {
      return `Your Abbott device battery status is: ${telemetry.batteryStatus}. No action needed at this time.`;
    }
    if (msg.includes('exercise') || msg.includes('walk') || msg.includes('activity')) {
      if (telemetry.thoracicImpedance < 110) {
        return 'Your fluid levels are slightly elevated today. Light stretching is fine, but hold off on cardio and rest up.';
      }
      if (telemetry.pacingPercentage > 95) {
        return 'Your pacemaker is working hard today. Stick to gentle stretches and deep breathing — skip the cardio.';
      }
      return `Your heart rate is at ${telemetry.heartRate} BPM and comfortably within your safe zone. You are clear for a 20-minute walk today.`;
    }
    return "That's a great question. I'll flag this for your care team at your next Merlin.net sync.";
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/ai/HealthAIEngine.test.ts --no-coverage
```

Expected: PASS — all tests green (existing + new).

- [ ] **Step 5: Commit**

```bash
git add src/ai/HealthAIEngine.ts src/ai/HealthAIEngine.test.ts
git commit -m "feat: add getChatResponse to HealthAIEngine for AI chat stub"
```

---

## Task 5: Refactor App.tsx + create DashboardScreen

**Files:**
- Modify: `App.tsx`
- Create: `src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Create DashboardScreen.tsx**

Create `src/screens/DashboardScreen.tsx` with all current App.tsx logic, updated for God Mode:

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ActivityIndicator,
  TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { Colors, Spacing, Typography, LegalStrings } from '../theme/Theme';
import { SecureMerlinNetService } from '../services/MerlinNetService';
import { SecureBLEService } from '../services/BLEService';
import { HealthPlatformService } from '../services/HealthPlatformService';
import { HealthAIEngine } from '../ai/HealthAIEngine';
import { ConsentModal } from '../components/ConsentModal';
import { StubDataService } from '../services/StubDataService';
import { CardiacTelemetry, PacingParameters, UserHealthProfile } from '../models/health';

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
    isDemo ? HealthAIEngine.generateCoachingInsight(demoTelemetry!, PatientProfile) : ''
  );
  const [healthAlert, setHealthAlert] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{
    title: string;
    description: string;
    onAllow: () => void;
  } | null>(null);
  const [blePermissionGranted, setBlePermissionGranted] = useState(isDemo);
  const [healthPermissionGranted, setHealthPermissionGranted] = useState(false);

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

  const requestHealthPermission = () => {
    setModalContent({
      title: 'Connect Your Health Platforms',
      description:
        'Syncing with Apple Health allows Aura AI to cross-verify your heart data for enhanced safety and more accurate insights.',
      onAllow: async () => {
        setModalContent(null);
        const granted = await HealthPlatformService.requestPermissions();
        if (granted) setHealthPermissionGranted(true);
      },
    });
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
        <Text style={styles.loadingText}>Syncing Merlin.net\u2122 Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={Typography.caption}>Aura AI for Abbott\u00AE</Text>
            <Text style={Typography.h1}>{PatientProfile.name}</Text>
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

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Aura AI Guidance</Text>
          <Text style={styles.insightBody}>{insight}</Text>

          {!healthPermissionGranted ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.secondary, marginTop: Spacing.m }]}
              onPress={requestHealthPermission}
            >
              <Text style={styles.actionButtonText}>Connect Apple Health &amp; Google Health</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.syncedBadge}>
              <Text style={styles.syncedText}>Health Platforms Synced</Text>
            </View>
          )}

          {!isDemo && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.primary, marginTop: Spacing.s }]}
              onPress={syncAura}
            >
              <Text style={styles.actionButtonText}>Sync myMerlinPulse\u2122 Device</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={Typography.caption}>Pacing</Text>
            <Text style={Typography.h2}>{telemetry.pacingPercentage}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={Typography.caption}>Fluid (Imp)</Text>
            <Text style={Typography.h2}>{telemetry.thoracicImpedance}\u03A9</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={Typography.caption}>Battery</Text>
            <Text style={[Typography.h2, { color: Colors.success }]}>{telemetry.batteryStatus}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.legalNotice}>{LegalStrings.trademarkNotice}</Text>
          <Text style={styles.disclaimerText}>{LegalStrings.disclaimer}</Text>
          <Text style={styles.copyrightText}>{LegalStrings.copyright}</Text>
        </View>

      </ScrollView>

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
    backgroundColor: Colors.card, borderRadius: 16, padding: Spacing.l, marginBottom: Spacing.xl,
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
  syncedBadge: { backgroundColor: '#E8F5E9', padding: Spacing.s, borderRadius: 8, marginTop: Spacing.m, alignItems: 'center' },
  syncedText: { color: Colors.success, fontWeight: '600', fontSize: 12 },
  actionButton: { marginTop: Spacing.m, paddingVertical: Spacing.m, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  statBox: { backgroundColor: Colors.card, width: '30%', padding: Spacing.m, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  footer: { paddingTop: Spacing.l, paddingBottom: Spacing.xl, borderTopWidth: 1, borderTopColor: '#EEE', marginTop: Spacing.m },
  legalNotice: { ...Typography.legal, marginBottom: Spacing.s, fontWeight: 'bold' },
  disclaimerText: { ...Typography.legal, marginBottom: Spacing.s, lineHeight: 16 },
  copyrightText: { ...Typography.legal, fontSize: 10 },
});
```

- [ ] **Step 2: Replace App.tsx with navigation shell**

Overwrite `App.tsx` with:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AICoachScreen } from './src/screens/AICoachScreen';
import { Colors } from './src/theme/Theme';

export type RootTabParamList = {
  Dashboard: undefined;
  History: undefined;
  'AI Coach': undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Dashboard: 'heart',
  History: 'bar-chart',
  'AI Coach': 'chatbubble-ellipses',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="AI Coach" component={AICoachScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

Note: `HistoryScreen` and `AICoachScreen` will be created in later tasks. TypeScript will show errors until then — that is expected at this step.

- [ ] **Step 3: Verify TypeScript on DashboardScreen (ignore missing screen errors)**

```bash
npx tsc --noEmit 2>&1 | grep -v "HistoryScreen\|AICoachScreen"
```

Expected: no errors other than the two missing screens.

- [ ] **Step 4: Commit**

```bash
git add App.tsx src/screens/DashboardScreen.tsx
git commit -m "feat: extract DashboardScreen and wire React Navigation shell"
```

---

## Task 6: TrendChart component

**Files:**
- Create: `src/components/TrendChart.tsx`

- [ ] **Step 1: Create TrendChart.tsx**

Create `src/components/TrendChart.tsx`:

```typescript
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
              fill: ({ datum }: { datum: ChartDataPoint }) =>
                dangerThreshold !== undefined && datum.y > dangerThreshold
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "TrendChart"
```

Expected: no output (no errors in TrendChart.tsx).

- [ ] **Step 3: Commit**

```bash
git add src/components/TrendChart.tsx
git commit -m "feat: add TrendChart component with line, area, and bar support"
```

---

## Task 7: HistoryScreen

**Files:**
- Create: `src/screens/HistoryScreen.tsx`

- [ ] **Step 1: Create HistoryScreen.tsx**

Create `src/screens/HistoryScreen.tsx`:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "AICoachScreen"
```

Expected: no errors other than the still-missing AICoachScreen.

- [ ] **Step 3: Commit**

```bash
git add src/screens/HistoryScreen.tsx
git commit -m "feat: add HistoryScreen with 7-day telemetry trend charts"
```

---

## Task 8: ChatBubble component

**Files:**
- Create: `src/components/ChatBubble.tsx`

- [ ] **Step 1: Create ChatBubble.tsx**

Create `src/components/ChatBubble.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';
import { ChatMessage } from '../models/health';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.sender === 'ai';
  const timeLabel = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isAI ? styles.rowAI : styles.rowUser]}>
      {isAI && (
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>A</Text>
        </View>
      )}
      <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
        <Text style={[styles.messageText, isAI ? styles.textAI : styles.textUser]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, isAI ? styles.timestampAI : styles.timestampUser]}>
          {timeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: Spacing.m, alignItems: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.s,
  },
  avatarLabel: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  bubble: { maxWidth: '75%', padding: Spacing.m, borderRadius: 16 },
  bubbleAI: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  textAI: { color: Colors.text },
  textUser: { color: '#FFF' },
  timestamp: { fontSize: 10, marginTop: 4 },
  timestampAI: { color: Colors.textSecondary },
  timestampUser: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "ChatBubble"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatBubble.tsx
git commit -m "feat: add ChatBubble component for AI chat UI"
```

---

## Task 9: ReminderCard component

**Files:**
- Create: `src/components/ReminderCard.tsx`

- [ ] **Step 1: Create ReminderCard.tsx**

Create `src/components/ReminderCard.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';

interface Reminder {
  id: string;
  text: string;
  subtitle: string;
}

const INITIAL_REMINDERS: Reminder[] = [
  { id: '1', text: 'Device Check Appointment', subtitle: 'Next Tuesday at 2:00 PM' },
  { id: '2', text: 'Merlin.net Nightly Sync', subtitle: 'Daily at 9:00 PM' },
  { id: '3', text: 'Low Sodium Diet Goal', subtitle: 'Daily reminder' },
];

export function ReminderCard() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Reminders</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { /* demo: no-op */ }}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {INITIAL_REMINDERS.map((reminder, index) => (
        <TouchableOpacity
          key={reminder.id}
          style={[styles.row, index < INITIAL_REMINDERS.length - 1 && styles.rowBorder]}
          onPress={() => toggle(reminder.id)}
        >
          <View style={[styles.checkbox, completed.has(reminder.id) && styles.checkboxDone]}>
            {completed.has(reminder.id) && <Text style={styles.checkmark}>&#10003;</Text>}
          </View>
          <View style={styles.reminderContent}>
            <Text style={[styles.reminderTitle, completed.has(reminder.id) && styles.reminderTitleDone]}>
              {reminder.text}
            </Text>
            <Text style={styles.reminderSubtitle}>{reminder.subtitle}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.l,
    marginTop: Spacing.l,
    marginBottom: Spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.m,
  },
  cardTitle: { ...Typography.h2, color: Colors.text },
  addButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.m, paddingVertical: Spacing.s,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.legalGray,
  },
  addButtonText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.m },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.primary,
    marginRight: Spacing.m,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  reminderContent: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reminderTitleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  reminderSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "ReminderCard"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/ReminderCard.tsx
git commit -m "feat: add ReminderCard component with toggle and demo reminders"
```

---

## Task 10: AICoachScreen

**Files:**
- Create: `src/screens/AICoachScreen.tsx`

- [ ] **Step 1: Create AICoachScreen.tsx**

Create `src/screens/AICoachScreen.tsx`:

```typescript
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';
import { StubDataService } from '../services/StubDataService';
import { HealthAIEngine } from '../ai/HealthAIEngine';
import { ChatBubble } from '../components/ChatBubble';
import { ReminderCard } from '../components/ReminderCard';
import { ChatMessage } from '../models/health';

const QUICK_REPLIES = [
  'How is my pacing?',
  'Is my fluid normal?',
  'Can I exercise today?',
];

let msgCounter = 200;

export function AICoachScreen() {
  const isDemo = StubDataService.isDemoMode();
  const currentTelemetry = StubDataService.getCurrentTelemetry();
  const demoState = isDemo ? StubDataService.getDemoState() : null;

  const [messages, setMessages] = useState<ChatMessage[]>(
    demoState ? demoState.preloadedChatMessages : [],
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: String(++msgCounter),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: String(++msgCounter),
        sender: 'ai',
        text: HealthAIEngine.getChatResponse(trimmed, currentTelemetry),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 1200);
  }, [currentTelemetry]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={Typography.h1}>Aura AI Coach</Text>
          <Text style={[Typography.caption, { marginTop: 4 }]}>
            Powered by Abbott\u00AE Merlin.net\u2122
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <View style={styles.typingRow}>
              <View style={styles.typingAvatar}>
                <Text style={styles.typingAvatarLabel}>A</Text>
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>Aura AI is thinking...</Text>
              </View>
            </View>
          )}

          <ReminderCard />
        </ScrollView>

        <View style={styles.quickRepliesRow}>
          {QUICK_REPLIES.map(reply => (
            <TouchableOpacity key={reply} style={styles.chip} onPress={() => sendMessage(reply)}>
              <Text style={styles.chipText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Aura AI about your heart..."
            placeholderTextColor={Colors.textSecondary}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.m, paddingTop: Spacing.m, paddingBottom: Spacing.s },
  chatContent: { padding: Spacing.m, paddingBottom: Spacing.l },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.m },
  typingAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.s,
  },
  typingAvatarLabel: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  typingBubble: {
    backgroundColor: Colors.card, padding: Spacing.m, borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 13 },
  quickRepliesRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.m, paddingBottom: Spacing.s,
    gap: 8,
  },
  chip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: Spacing.m, paddingVertical: Spacing.s,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.primary,
  },
  chipText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m, paddingBottom: Spacing.m,
    alignItems: 'center', gap: Spacing.s,
  },
  input: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 22,
    paddingHorizontal: Spacing.m, paddingVertical: 12,
    fontSize: 14, color: Colors.text,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.m, paddingVertical: 12,
    borderRadius: 22,
  },
  sendButtonDisabled: { backgroundColor: Colors.textSecondary },
  sendButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
```

- [ ] **Step 2: Run full TypeScript check — all errors should now be resolved**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/screens/AICoachScreen.tsx
git commit -m "feat: add AICoachScreen with chat interface and reminders"
```

---

## Task 11: iOS configuration

**Files:**
- Modify: `app.json`
- Modify: `eas.json`

- [ ] **Step 1: Update app.json**

In `app.json`, make the following changes to the `expo.ios` section:

**Change** `"bundleIdentifier": "com.abbott.crm.aura"` to `"bundleIdentifier": "com.abbott.aura-ai-coach"`

**Add** the `entitlements` key after `infoPlist`:

```json
"entitlements": {
  "com.apple.developer.healthkit": true
}
```

The complete `ios` section should look like:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.abbott.aura-ai-coach",
  "buildNumber": "1.0.0",
  "infoPlist": {
    "NSBluetoothAlwaysUsageDescription": "Aura AI requires Bluetooth access to securely sync with your Abbott® CRM device for real-time heart health monitoring.",
    "NSBluetoothPeripheralUsageDescription": "Aura AI uses Bluetooth to communicate with your implanted device.",
    "NSHealthShareUsageDescription": "Aura AI integrates with health data to provide personalized activity coaching.",
    "NSHealthUpdateUsageDescription": "Aura AI updates your activity metrics based on your cardiac performance."
  },
  "entitlements": {
    "com.apple.developer.healthkit": true
  }
}
```

- [ ] **Step 2: Add demo profile to eas.json**

In `eas.json`, add the `demo` profile inside the `build` object:

```json
"demo": {
  "distribution": "internal",
  "ios": {
    "simulator": false
  },
  "env": {
    "APP_ENV": "demo"
  }
}
```

The complete `eas.json` should look like:

```json
{
  "build": {
    "demo": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "env": {
        "APP_ENV": "demo"
      }
    },
    "test-drive": {
      "android": { "buildType": "apk" },
      "ios": { "buildType": "app" }
    },
    "preview": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true,
      "node": "18.18.0"
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 3: Verify JSON is valid**

```bash
node -e "require('./app.json'); require('./eas.json'); console.log('JSON valid')"
```

Expected: `JSON valid`

- [ ] **Step 4: Run full test suite one final time**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app.json eas.json
git commit -m "chore: configure iOS bundle ID, HealthKit entitlement, and EAS demo profile"
```

---

## Final verification

- [ ] **Run all tests**

```bash
npx jest --no-coverage
```

Expected output:
```
Test Suites: 3 passed, 3 total
Tests:       N passed, N total
```

- [ ] **TypeScript clean**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Start dev server and confirm app loads**

```bash
npx expo start --ios
```

Expected: app opens in iOS Simulator, 3 tabs visible, Dashboard shows HR ring, History shows charts, AI Coach shows chat + reminders.

---

## Ready to build for TestFlight

Once all tasks above are complete, follow `docs/guides/eas-testflight-setup.md` to:
1. Run `eas init` (one-time)
2. Run `eas credentials --platform ios` (one-time)
3. Enable HealthKit in Apple Developer portal (one-time)
4. Build: `eas build --platform ios --profile demo`
