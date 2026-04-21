# Aura AI Coach

An Expo / React Native app for patients with Abbott cardiac rhythm management (CRM) devices. The app syncs telemetry via Bluetooth and Merlin.net, then delivers AI-driven wellness coaching directly on the patient's phone.

> **This app is not a diagnostic tool.** It is intended for general wellness coaching only. Always follow your physician's guidance.

---

## Features

| Tab | What it does |
|-----|-------------|
| **Dashboard** | Live heart rate, pacing %, thoracic impedance, AFib burden, battery status, and a daily AI coaching insight |
| **History** | 7-day trend charts for heart rate, fluid levels (impedance), and pacing percentage |
| **AI Coach** | Keyword-aware chat with your device data — ask about pacing, fluid levels, exercise, battery, and more. Includes medication and appointment reminders. |

**God Mode (demo build):** Set `APP_ENV=demo` to run the app with fully stubbed, deterministic data — no Bluetooth, no Merlin.net credentials required. All demo data is centralized in `StubDataService`.

---

## Tech Stack

- **Expo** ~55 / **React Native** 0.83.2 / **TypeScript** strict
- **React Navigation** (Bottom Tabs) for 3-tab shell
- **victory-native** + **react-native-svg** for telemetry charts
- **@expo/vector-icons** (Ionicons) for tab bar icons
- **EAS Build** for TestFlight distribution

---

## Quick Start

```bash
npm install
npx expo start          # Expo dev server
npm run ios             # iOS simulator
npm run android         # Android emulator
npx jest                # Run all tests (34 tests, 6 suites)
```

### Demo mode (no device required)

```bash
APP_ENV=demo npx expo start
```

---

## Project Structure

```
src/
  ai/
    HealthAIEngine.ts       # Stateless coaching logic (safe zones, insights, chat)
  components/
    ChatBubble.tsx          # AI / user message layout
    ConsentModal.tsx        # Explicit BLE + health permission request
    ReminderCard.tsx        # Medication & appointment reminders
    TrendChart.tsx          # Reusable line / area / bar chart wrapper
  models/
    health.ts               # Core types: CardiacTelemetry, PacingParameters, ChatMessage
  screens/
    DashboardScreen.tsx     # Live telemetry dashboard
    HistoryScreen.tsx       # 7-day trend charts
    AICoachScreen.tsx       # Chat interface + reminders
  services/
    BLEService.ts           # BLE sync (simulated; production: react-native-ble-plx)
    MerlinNetService.ts     # Merlin.net API calls (simulated)
    HealthPlatformService.ts# HealthKit / Health Connect bridge (stubbed)
    StubDataService.ts      # God Mode demo data
```

---

## iOS Distribution (TestFlight)

See [`docs/guides/eas-testflight-setup.md`](docs/guides/eas-testflight-setup.md) for the one-time setup.

Once credentials are configured:

```bash
eas build --platform ios --profile demo
```

Bundle identifier: `com.abbott.aura-ai-coach`

---

## Compliance Notes

- All telemetry values are clamped to physiologically valid ranges (HR 30–220 BPM, impedance 20–200 Ω, pacing 0–100%) before reaching the AI engine.
- Patient ID inputs are sanitized to `[a-zA-Z0-9-]` before any API call.
- Production BLE requires a cryptographic challenge-response handshake with Abbott devices (stubbed in `SecureBLEService`).
- The legal disclaimer in `src/theme/Theme.ts → LegalStrings` must accompany any UI changes to the app footer.
