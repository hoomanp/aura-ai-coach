# Aura AI Coach — iOS Demo Build Design

**Date:** 2026-04-21
**Target:** Demo/investor build distributed via TestFlight
**Scope:** Multi-tab navigation, 3 new features, stub "God Mode" demo data, iOS release configuration

---

## 1. Goals

- Transform the single-screen prototype into a polished, multi-tab iOS app that demonstrates product depth to investors.
- Add three new features: Historical Trends, Reminders, and AI Chat — all powered by stub data.
- Configure EAS + `app.json` for TestFlight internal distribution.
- Isolate all demo-mode logic behind an `APP_ENV=demo` flag so production code stays clean.

## 2. Architecture

### Navigation

Use `@react-navigation/native` + `@react-navigation/bottom-tabs`. `App.tsx` becomes a thin shell containing only `NavigationContainer` and `Tab.Navigator`. All screen logic moves to dedicated screen files.

**Tab bar (3 tabs):**

| Tab | Screen | Purpose |
|-----|--------|---------|
| Dashboard | `DashboardScreen.tsx` | Existing App.tsx logic |
| History | `HistoryScreen.tsx` | 7-day telemetry trend charts |
| AI Coach | `AICoachScreen.tsx` | Chat interface + Reminders card |

### File Structure

```
src/
  screens/
    DashboardScreen.tsx     ← App.tsx logic moved here
    HistoryScreen.tsx       ← new
    AICoachScreen.tsx       ← new
  components/
    ConsentModal.tsx        ← unchanged
    ChatBubble.tsx          ← new
    TrendChart.tsx          ← new
    ReminderCard.tsx        ← new
  services/
    BLEService.ts           ← unchanged
    MerlinNetService.ts     ← unchanged
    HealthPlatformService.ts ← unchanged
    StubDataService.ts      ← new: 7-day synthetic history + God Mode state
  ai/
    HealthAIEngine.ts       ← extended with chat response method
  models/
    health.ts               ← unchanged
  theme/
    Theme.ts                ← unchanged
App.tsx                     ← NavigationContainer + Tab.Navigator only
```

### New Dependencies

- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `react-native-screens`
- `react-native-svg`
- `victory-native`

(`react-native-safe-area-context` is already installed.)

---

## 3. Feature Designs

### 3.1 History Tab — Telemetry Trends

**Data source:** `StubDataService.generateHistory()` — produces 7 days of deterministic synthetic `CardiacTelemetry[]`, seeded so values look realistic and stable across reloads (not random-janky).

**Charts (rendered with `victory-native`):**
- **Heart Rate** — line chart, 7-day, with dashed reference lines at `lowerRateLimit` and `upperSensorRate`
- **Pacing %** — area chart, 7-day
- **AFib Burden** — bar chart, 7-day; bars colored `Colors.danger` when > 5%

Each chart has an Abbott-blue section header with a computed weekly average subtitle (e.g., "Avg 74 BPM this week"). Tapping a data point shows a tooltip with date + value.

---

### 3.2 AI Coach Tab — Reminders

A `ReminderCard` component rendered below the chat interface.

**Pre-seeded stub reminders (3):**
1. "Device check appointment — next Tuesday"
2. "Merlin.net nightly sync — 9:00 PM daily"
3. "Low sodium diet goal — daily"

Reminders can be toggled complete via local state (resets on app restart — appropriate for demo). A `+` button opens a bottom sheet with a mock "Add Reminder" form that pre-fills a demo entry on confirm. No persistence.

---

### 3.3 AI Coach Tab — Chat Interface

Scrollable chat UI with Abbott-branded "Aura AI" avatar. Patient types or taps a quick-reply chip; response appears after a 1.2s simulated delay.

**Quick-reply chips (pre-loaded):**
- "How is my pacing?"
- "Is my fluid normal?"
- "Can I exercise today?"

**Stub response engine** (`HealthAIEngine.getChatResponse(message, telemetry)`):

| Keyword match | Response |
|---------------|----------|
| `pacing`, `pacemaker` | Plain-language explanation of current pacing % |
| `fluid`, `impedance` | Reassurance based on current thoracic impedance |
| `heart rate`, `bpm` | Current HR contextualized against safe zone |
| `battery` | Reports battery status from telemetry |
| `exercise`, `walk`, `activity` | Returns the coaching insight from `generateCoachingInsight()` |
| *(fallback)* | "That's a great question. I'll flag this for your care team at your next Merlin.net sync." |

**Pre-loaded conversation state in God Mode:** 3 messages already in thread on first open (shows feature is active, not blank for demo).

---

## 4. God Mode — Demo Data Strategy

Controlled by `APP_ENV=demo` (set in EAS `demo` build profile).

`StubDataService` checks this flag and returns an opinionated demo state:

| State | Demo Value | Reason |
|-------|-----------|--------|
| HR | 74 BPM | Comfortably within safe zone — shows green |
| AFib burden | 0.1% | Reassuringly low |
| Thoracic impedance | 125 Ω | Normal range |
| BLE connected | `true` | No "Reconnecting..." for demo |
| Battery | `Good` | Clean state |
| History | 7 days, clean trend | Impressive-looking data |
| Chat | 3 pre-loaded messages | Feature looks active |
| Consent modal | Always skipped | Demo never opens with a permission gate |

All God Mode logic is isolated in `StubDataService.ts`. No production code paths are affected.

---

## 5. iOS Release Configuration

### `app.json` additions

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.abbott.aura-ai-coach",
      "buildNumber": "1",
      "infoPlist": {
        "NSBluetoothAlwaysUsageDescription": "Aura AI uses Bluetooth to securely sync with your Abbott cardiac device.",
        "NSHealthShareUsageDescription": "Aura AI reads heart rate data from Apple Health to cross-verify your device readings.",
        "NSHealthUpdateUsageDescription": "Aura AI may write wellness activity data to Apple Health."
      },
      "entitlements": {
        "com.apple.developer.healthkit": true
      }
    }
  }
}
```

### `eas.json` — demo profile

```json
{
  "build": {
    "demo": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "env": { "APP_ENV": "demo" }
    }
  }
}
```

### Build & distribute command

```bash
eas build --platform ios --profile demo
```

Output: `.ipa` auto-uploaded to TestFlight → share internal link to demo devices.

---

## 6. Out of Scope

- Real BLE / Merlin.net API integration (remains stubbed)
- Android build (focus is iOS for this release)
- Data persistence across sessions
- Authentication / patient login
- Push notifications for reminders
- App Store public submission

---

## 7. Open Questions for Developer

Before starting implementation, confirm:
1. Apple Developer account team ID and bundle identifier preference (`com.abbott.aura-ai-coach` or different?)
2. EAS project ID — run `eas init` if not yet configured
3. TestFlight tester emails to add after first build
