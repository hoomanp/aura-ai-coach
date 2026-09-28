# Cadence — Cardiac Wellness Coach (v2 design)

**Date:** 2026-05-26
**Working name:** Cadence *(requires USPTO + EU trademark clearance before public launch)*
**iOS bundle ID:** `com.cadencecoach.app`
**Android package:** `com.cadencecoach.app`
**Predecessor:** `aura-ai-coach` (Expo demo, Abbott-branded — to be archived and stripped of all Abbott trademarks)
**Scope:** Complete rebuild of the demo as a portfolio-grade, B2C, US-only cardiac wellness coach for iOS + Android + Apple Watch + Wear OS, with AWS backend and three-tier AI router.

---

## 1. Product premise

A B2C cardiac wellness coach for iPhone, Android, Apple Watch, and Wear OS. Target users: people in cardiac recovery (post-myocardial infarction, post-stent, post-ablation) and chronic atrial fibrillation self-managers.

Data sources: Apple HealthKit and Google Health Connect — wearable and phone-derived heart rate, HRV, AFib notifications, activity, sleep. **No implanted-device telemetry**, no Merlin.net, no Abbott branding.

AI Coach routes queries across three tiers:
1. Deterministic rules (safety-critical and emergency queries)
2. On-device small models — Apple Foundation Models (iOS 26+) and Gemini Nano (Android) — for casual queries, offline, privacy-preserving
3. Anthropic Claude via AWS Bedrock for premium-tier open-ended coaching

Monetization: freemium subscription via RevenueCat. Free tier = rules + on-device. Pro tier ($8/mo, $60/yr) = cloud LLM, unlimited history, advanced analytics, Watch premium.

Launch market: US-only, English-only. Architected to enable EU/UK launch later without rework.

Operating posture: solo development, no fixed deadline. Optimized for engineering excellence as a portfolio artifact — production-grade security patterns, CI/CD, observability, architecture decision records — without pursuing real PHI handling, HIPAA covered-entity status, or FDA submission in v1.

---

## 2. Locked decisions (recap of brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Legal/commercial status | Independent wellness app, no Abbott affiliation |
| 2 | Product scope | Cardiac wellness coach (Watch + phone) |
| 3 | AI architecture | Three-tier: rules + on-device + cloud LLM |
| 4 | Cloud + backend stack | AWS Amplify Gen 2 + Bedrock |
| 5 | Native code strategy | Expo Dev Client + selective native modules |
| 6 | Monetization | Freemium subscription via RevenueCat |
| 7 | Launch market | US-only, English |
| 8 | Watch companion scope | Minimal (complication + tile + Live Activity) |
| 9 | Team & timeline | Solo, no fixed deadline, build for learning |

---

## 3. System architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Mobile client (Expo Dev Client + React Native 0.83 + TS strict)    │
│                                                                       │
│  Screens: Onboarding · Dashboard · History · Coach · Settings        │
│  State: Zustand (UI) + React Query (server cache) + MMKV (persist)   │
│                                                                       │
│  Native modules (Swift / Kotlin):                                    │
│    · HealthKitBridge (iOS observers, background delivery)            │
│    · HealthConnectBridge (Android, background workmanager)           │
│    · BiometricGate (Face ID / Touch ID / BiometricPrompt)            │
│    · SecureStore (Keychain / EncryptedSharedPreferences)             │
│    · FoundationModelBridge (iOS 26+ on-device LLM)                   │
│    · GeminiNanoBridge (Android AICore on-device LLM)                 │
│    · CertPinner (TLS 1.3 public-key pinning)                         │
│    · AppAttestBridge / PlayIntegrityBridge                           │
│    · RevenueCat SDK (subscription mgmt)                              │
│                                                                       │
│  Watch companion (separate native targets):                          │
│    · watchOS: ComplicationController + WidgetKit + LiveActivities    │
│    · Wear OS: TileService + ComplicationDataSourceService            │
└─────────────────────────────────┬───────────────────────────────────┘
                                   │ HTTPS · TLS 1.3 · cert-pinned · OIDC bearer
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AWS (Amplify Gen 2 backend, us-east-1 primary, us-west-2 DR)       │
│                                                                       │
│  Cognito (User Pools) ──► AppSync (GraphQL) ──► Lambda (TS, ARM64)  │
│     · Sign in w/ Apple    · typed schema       · per-resolver IAM    │
│     · Sign in w/ Google   · subscriptions      · least privilege     │
│     · Email magic link    · field auth         · Powertools logging  │
│                                                                       │
│  Data:                                                                │
│     · DynamoDB single-table (PK=USER#<id>, SK=entity#ts)             │
│     · S3 (audit logs, exports) with SSE-KMS                          │
│     · KMS CMK (per-customer-ready, single key in v1)                 │
│                                                                       │
│  AI:                                                                  │
│     · Bedrock (Claude Haiku for routine, Sonnet for complex)         │
│     · Prompt + response audit log → S3 (PHI-stripped via filter)     │
│                                                                       │
│  Messaging:                                                           │
│     · Pinpoint (push: transactional only in v1)                      │
│     · EventBridge (domain events for future analytics)               │
│                                                                       │
│  Ops:                                                                 │
│     · CloudTrail · GuardDuty · CloudWatch · Secrets Manager          │
│     · AppConfig (feature flags, kill switches)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Why Amplify Gen 2

- Typed TypeScript schema → automatic GraphQL → React Native client codegen
- Per-resolver IAM out of the box (no wildcard policies)
- HIPAA-eligible across all services (Cognito, AppSync, Lambda, DynamoDB, S3, Bedrock, KMS, Secrets Manager) — future-proofs B2B2C pivot without rearchitecture
- Local sandbox (`npx ampx sandbox`) for dev productivity
- Bedrock + AppSync + Cognito under one console, one bill, one BAA story when needed

### 3.2 Why Bedrock over Anthropic API direct

- Keeps prompt + response data inside AWS account perimeter — single audit boundary
- Same IAM/KMS controls as the rest of the stack
- Lower latency from us-east-1 Lambda → us-east-1 Bedrock vs. cross-account
- One BAA (with AWS) instead of two (AWS + Anthropic) when HIPAA becomes relevant
- Trade-off: slightly slower model availability vs. Anthropic direct, occasional regional gaps. Acceptable.

---

## 4. AI router design

All inbound chat messages enter the router. The router classifies and dispatches:

```
User message
     │
     ▼
┌──────────────────────────────────────────┐
│ Safety classifier (in-process, rules)    │
│ Categories: EMERGENCY, SAFETY_CRITICAL,  │
│             ROUTINE, OPEN_ENDED          │
└────────────┬─────────────────────────────┘
             │
   ┌─────────┴─────────┬──────────────┬────────────┐
   ▼                   ▼              ▼            ▼
EMERGENCY        SAFETY_CRITICAL    ROUTINE     OPEN_ENDED
  │                  │                │             │
  ▼                  ▼                ▼             ▼
Hardcoded         Rules engine    On-device LLM  Tier check
"call 911" +      (current        (Foundation /     │
escalation        HealthAIEngine, Gemini Nano)   ┌──┴──┐
prompt            expanded)            │        Free  Pro
                       │                ▼          │    │
                       ▼          Output filter   On-  Bedrock
                  Output filter        │         dev   Claude
                       │               │          ▼     │
                       ▼               ▼        (same) Output
                  Response         Response            filter
                                                        │
                                                        ▼
                                                    Response
```

### 4.1 Safety classifier

Pure TypeScript, runs in-process, deterministic. Keyword + regex + context window over the user's last N messages. No model dependency.

| Category | Trigger examples | Action |
|----------|------------------|--------|
| EMERGENCY | "chest pain", "can't breathe", "passing out", "stroke" | Hardcoded response: "If this is a medical emergency, call 911 now." + skip all AI |
| SAFETY_CRITICAL | "can I exercise", "should I take", "is X safe", "is my heart rate too high" | Rules engine only — never an LLM |
| ROUTINE | "what is HRV", "how do I log a walk" | On-device LLM (free) or rules (fallback) |
| OPEN_ENDED | conversational, journaling, encouragement | Tier-gated: on-device (free) or Bedrock (pro) |

Classifier code is the single source of truth for safety policy. All changes go through code review with an ADR.

### 4.2 Output filter

Runs on every response from any tier. Strips:
- Diagnostic language ("you have...", "this means you have...")
- Specific medication recommendations ("take aspirin", "stop your beta blocker")
- Personally identifying information (names, addresses, phone numbers if echoed)

Appends a "not medical advice — consult your physician" footer when confidence score (returned by classifier) is below threshold.

---

## 5. Security baseline (portfolio-grade)

### 5.1 Transport
- TLS 1.3 enforced, no fallback
- Public-key certificate pinning via `react-native-cert-pinner`, pinned to AWS CloudFront cert chain
- HSTS preload eligibility for marketing site
- No cleartext traffic permitted (iOS ATS strict, Android `cleartextTrafficPermitted=false`)

### 5.2 Authentication & authorization
- Cognito User Pools with email + Sign in with Apple + Sign in with Google
- OAuth 2.0 Authorization Code with PKCE for all flows
- Refresh tokens stored in iOS Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly) / Android Keystore via `expo-secure-store`
- Access tokens never persisted, in-memory only
- AppSync field-level authorization rules — users can only read/write their own data
- Lambda execution roles: per-resolver, least-privilege, no `*` actions

### 5.3 At rest
- DynamoDB encryption with customer-managed KMS key (CMK)
- S3 SSE-KMS for all buckets, bucket policies deny unencrypted PUT
- iOS Data Protection class `NSFileProtectionCompleteUnlessOpen` for app sandbox files
- Android EncryptedSharedPreferences for any sensitive preferences
- MMKV on device encrypted with a key stored in SecureStore

### 5.4 Device posture
- Jailbreak / root detection on launch — advisory banner, not blocking (per Apple guidelines, blocking jailbroken devices can violate App Review)
- Biometric gate (Face ID / Touch ID / BiometricPrompt) on app foreground for any screen showing health data
- App Attest (iOS) and Play Integrity (Android) on initial token exchange and periodically — server rejects requests from un-attested devices for sensitive endpoints

### 5.5 IAM and secrets
- All Lambda roles defined per-resolver in Amplify Gen 2 backend definition
- No wildcard actions; explicit resource ARNs
- AWS Secrets Manager for Bedrock model IDs, RevenueCat webhook secret, third-party API keys
- Secrets rotation enabled on schedule
- No secrets in code or in `.env` files in repo; CI loads from GitHub Actions secrets and AWS Parameter Store

### 5.6 AI-specific controls
- Bedrock prompt + response logged to S3 (KMS-encrypted) with `correlationId` linkable to the originating request
- Output filter strips PHI from logs (no health data stored in plaintext logs)
- System prompts versioned in code, change-controlled via PRs
- Token rate limit per user per day (defends against runaway cost + abuse)
- Cloud-LLM tier has a global kill switch via AppConfig — flip if Bedrock pricing spikes or safety incident

### 5.7 Vulnerability management
- GitHub Dependabot (npm, gradle, pods)
- Snyk for transitive deps + container images
- SAST via Semgrep with custom rules for the safety classifier
- Secret scanning via Gitleaks (pre-commit hook + CI gate)
- Quarterly penetration test budgeted (third party, externally; internal red-team exercise for portfolio)

---

## 6. Compliance posture (US-only B2C v1)

| Regulation | Applies? | Action in v1 |
|-----------|----------|--------------|
| HIPAA | No (B2C, no covered entity relationship) | Architected eligible (services + KMS) to enable later; no BAAs in v1 |
| FTC Health Breach Notification Rule | Yes | Breach response runbook documented; notification template ready |
| CCPA / CPRA | Yes | In-app data export + delete; privacy policy linked from sign-up; "Do Not Sell" toggle (always off) |
| Washington My Health My Data Act | Yes (some users in WA) | Explicit opt-in for "consumer health data"; geofence sharing |
| Connecticut, Texas, Oregon, Utah health privacy | Yes | Same consent + export flow satisfies all |
| Apple HealthKit terms | Yes | No advertising use, no third-party share without consent, no offline sale of health data |
| Google Health Connect terms | Yes | Same restrictions |
| Anthropic / Bedrock acceptable use | Yes | System prompt enforces non-diagnostic framing; output filter blocks diagnosis language |
| FDA SaMD | No (wellness framing) | Avoid disease-management or treatment claims; document marketing language guidelines |
| GDPR / UK GDPR | No (US-only launch) | Architected to enable: data residency tagging, RTBF flow, lawful basis logging |
| EU AI Act | No (no EU launch) | Re-evaluate before EU launch |

---

## 7. Data model

### 7.1 DynamoDB single-table

| PK | SK | Attributes |
|----|----|------------|
| `USER#<id>` | `PROFILE` | name, dob, sex, dxCodes[], consent{healthkit, healthconnect, cloudAI, marketing}, createdAt |
| `USER#<id>` | `METRIC#HR#<isoTs>` | bpm, source (watch/phone), modelId |
| `USER#<id>` | `METRIC#HRV#<isoTs>` | ms, source |
| `USER#<id>` | `METRIC#STEPS#<isoTs>` | count, source |
| `USER#<id>` | `METRIC#SLEEP#<isoTs>` | startTs, endTs, stage |
| `USER#<id>` | `AFIB#<isoTs>` | durationSec, source |
| `USER#<id>` | `SYMPTOM#<isoTs>` | type, severity, notes |
| `USER#<id>` | `CHAT#<isoTs>` | role, text, tier (rules/onDevice/cloud), modelVersion, correlationId |
| `USER#<id>` | `SUBSCRIPTION` | tier, expiresAt, rcId (RevenueCat ID), platform |
| `USER#<id>` | `CONSENT#<version>#<ts>` | scope, granted, ipHash (CCPA proof-of-consent) |

GSI1: `tier-index` (PK=`SUBSCRIPTION#<tier>`, SK=`USER#<id>`) for cohort analytics (no PII).
GSI2: `recent-metrics` (PK=`USER#<id>`, SK reversed for "last N" queries).

### 7.2 On-device cache (MMKV, encrypted)

- Last 7 days of metrics (for offline dashboard)
- User profile
- Subscription tier
- Last 50 chat messages
- Pending mutations (offline-first writes)

Sync strategy: optimistic local writes → AppSync mutation → DynamoDB. Conflict resolution: last-write-wins on metrics (idempotent on `<userId, ts>`), append-only on chat and symptoms.

### 7.3 Watch ↔ phone

WatchConnectivity (iOS) / Wearable Data Layer (Android): phone is source of truth, watch reads cached "today" metrics + writes "how do you feel" taps. No direct cloud connectivity from watch in v1.

---

## 8. Mobile architecture detail

### 8.1 Module structure

```
src/
  app/                        # navigation, providers, router
  features/
    onboarding/               # screens, hooks, services
    dashboard/
    history/
    coach/                    # chat UI + AI router client
    settings/
    subscription/             # RevenueCat integration
  shared/
    components/               # design-system primitives
    hooks/
    services/                 # native module wrappers, API clients
    theme/
    types/
  ai/
    safetyClassifier.ts       # the deterministic gate
    rulesEngine.ts            # SAFETY_CRITICAL responses
    outputFilter.ts           # post-processing
    onDevice/                 # Foundation Model + Gemini Nano bridges
    cloud/                    # Bedrock client
    router.ts                 # orchestrator
  native/                     # JS-side native module declarations
```

### 8.2 State management
- **Zustand**: UI state (modal open/closed, current tab, ephemeral form state)
- **React Query**: server cache (with optimistic updates, retry, background refetch)
- **MMKV**: persistent local cache (survives app kill)
- No Redux, no MobX, no Context API for global state

### 8.3 Navigation
- React Navigation v7 with native stack + bottom tabs
- Deep linking enabled (universal links / app links) for subscription return URLs and onboarding flows

### 8.4 Design system
- Tokens in `shared/theme/`: spacing scale (4/8/16/24/32/48), type scale, semantic colors, motion timing
- Components built from primitives (`Text`, `Box`, `Pressable`) — no inline styles outside primitives
- Reduced-motion + dynamic-type + high-contrast support from day one (cardiac recovery skews older)
- Dark mode as a first-class theme, not an afterthought

---

## 9. Backend architecture detail

### 9.1 Amplify Gen 2 schema (excerpt)

```ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Profile: a.model({
    name: a.string(),
    dob: a.date(),
    sex: a.enum(['male', 'female', 'other', 'unspecified']),
    dxCodes: a.string().array(),
    consent: a.json(),
  }).authorization(allow => [allow.owner()]),

  Metric: a.model({
    kind: a.enum(['hr', 'hrv', 'steps', 'sleep']),
    timestamp: a.datetime(),
    value: a.float(),
    source: a.string(),
  }).authorization(allow => [allow.owner()]),

  ChatMessage: a.model({
    role: a.enum(['user', 'assistant']),
    text: a.string(),
    tier: a.enum(['rules', 'onDevice', 'cloud']),
    modelVersion: a.string(),
    correlationId: a.string(),
    createdAt: a.datetime(),
  }).authorization(allow => [allow.owner()]),

  coachReply: a.query()
    .arguments({ message: a.string().required() })
    .returns(a.json())
    .handler(a.handler.function(coachReplyFn))
    .authorization(allow => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });
```

### 9.2 Lambda functions

- `coachReplyFn` — orchestrates the AI router on the backend for cloud-tier requests
- `revenueCatWebhookFn` — receives subscription state changes, updates DynamoDB
- `dataExportFn` — generates CCPA / WA-MHMDA-compliant export ZIP, signed S3 URL
- `dataDeleteFn` — cascading delete across DynamoDB + S3, with audit trail
- `breachDetectFn` — scheduled CloudWatch metric reader, alerts on anomalies

All Lambda functions: TypeScript, Powertools for AWS Lambda (logging, tracing, metrics), bundled with esbuild, ARM64 architecture, 256MB memory baseline, X-Ray tracing on.

### 9.3 RevenueCat integration

- RevenueCat is source of truth for subscription state
- Webhook → API Gateway → `revenueCatWebhookFn` → DynamoDB `SUBSCRIPTION` row
- Mobile clients read tier from DynamoDB on launch + on RevenueCat customer info refresh
- Server-side entitlement check on every cloud-LLM request — never trust client-claimed tier

---

## 10. CI/CD + observability

### 10.1 GitHub Actions pipeline

```
PR opened/updated:
  ├─ lint (eslint + prettier check)
  ├─ typecheck (tsc --noEmit)
  ├─ unit tests (jest, coverage gate)
  ├─ component tests (RN Testing Library)
  ├─ SAST (Semgrep)
  ├─ secret scan (Gitleaks)
  ├─ license check (license-checker)
  ├─ dependency audit (npm audit + Snyk)
  └─ build matrix:
     ├─ iOS preview (EAS dev profile)
     └─ Android preview (EAS dev profile)

Merge to main:
  ├─ all of the above, plus:
  ├─ e2e tests (Maestro on iOS sim + Android emu)
  ├─ Amplify Gen 2 sandbox deploy + integration tests
  └─ Amplify Gen 2 production deploy (with manual approval gate)

Tag (vX.Y.Z):
  ├─ EAS Build production iOS → TestFlight
  └─ EAS Build production Android → Play Internal
```

### 10.2 Observability

- **Sentry**: crash reporting, performance monitoring, release tracking, source maps uploaded by EAS
- **CloudWatch dashboards**: Lambda p50/p95/p99, AppSync 4xx/5xx, DynamoDB throttles, Bedrock token spend by user tier
- **CloudWatch alarms**: error rate > 1%, Bedrock spend > $X/day, Cognito sign-up failure spike
- **Structured logs**: JSON with `correlationId` propagated client → AppSync → Lambda → Bedrock for end-to-end tracing
- **AWS X-Ray**: enabled across Lambda and AppSync

### 10.3 ADRs

`docs/adrs/` — every major architectural choice gets an ADR using the Nygard format. Initial set:
- ADR-001: Expo Dev Client over bare RN or fully native
- ADR-002: AWS Amplify Gen 2 over Firebase / Supabase
- ADR-003: Bedrock over Anthropic API direct
- ADR-004: Three-tier AI router with deterministic safety classifier
- ADR-005: Single-table DynamoDB design
- ADR-006: RevenueCat over native receipt validation
- ADR-007: HIPAA-eligible architecture without HIPAA covered-entity status in v1
- ADR-008: US-only English launch with EU-ready architecture

---

## 11. Testing strategy

| Layer | Tool | Coverage target |
|-------|------|-----------------|
| Unit (pure logic) | Jest + ts-jest | 90% on `ai/` (safety classifier, output filter, rules engine); 70% overall |
| Component | RN Testing Library | All screens have a smoke test + key interaction tests |
| Native module | Native test runners (XCTest, JUnit) | Critical paths only (HealthKit observers, BiometricGate) |
| Contract | Pact | AppSync GraphQL schema contract |
| Integration | Jest + DynamoDB Local + Bedrock dev model | End-to-end coach reply flow |
| E2E | Maestro | 5 golden paths: onboarding, log symptom, ask coach, view history, upgrade to pro |
| Manual | TestFlight + Play Internal | Weekly dogfood, weekly regression checklist |
| AI-specific | Promptfoo or custom harness | Safety classifier regression suite (~200 prompts with expected categories) |

---

## 12. Migration from `aura-ai-coach` (existing demo)

| Existing artifact | Action |
|-------------------|--------|
| `App.tsx` (tab navigator) | Keep pattern, expand to include Onboarding stack and Settings |
| `DashboardScreen` | Rewrite data source: BLE/Merlin → HealthKitBridge / HealthConnectBridge |
| `HistoryScreen` | Keep chart components and Victory dependency; swap StubDataService → AppSync queries |
| `AICoachScreen` | Wrap with AI router client; add tier-aware UX (free/pro badges, upgrade prompt) |
| `HealthAIEngine` | Becomes the `rulesEngine.ts` module of the AI router; expand category coverage |
| `SecureBLEService` | **Delete.** No implanted-device BLE. (Resurrect in v1.5 for Polar H10-class chest straps.) |
| `SecureMerlinNetService` | **Delete.** No Abbott API. |
| `HealthPlatformService` | Replace stub with real native module bridges. Same external interface preserved where possible. |
| `StubDataService` | Keep for unit tests and Storybook fixtures. |
| `ConsentModal` | Keep as a design-system primitive; expand to handle multi-scope consent for CCPA + WA MHMDA |
| `Theme.ts` | Replace Abbott Blue palette with Cadence palette (TBD by designer or AI design pass) |
| `LegalStrings` | Rewrite entirely — strip all Abbott trademarks; write new disclaimers for FTC + WA MHMDA + Apple HealthKit terms |
| All `.worktrees/` content | Delete or archive |
| `credentials/` | Delete (Abbott-tied); regenerate fresh Apple and Google credentials under new Apple Developer account |
| `app.json` bundle IDs | Change to `com.cadencecoach.app` on both platforms |
| `package.json` name | Rename to `cadence` |
| Repo name | Rename or fork to `cadence` |

**Recommended approach:** new git repo, copy-forward only the files explicitly marked "Keep" above, with branding strip on copy. Do not try to evolve in place — the cleanup cost exceeds the rewrite cost.

---

## 13. Explicitly NOT in v1

- HIPAA covered-entity status, BAAs with any party
- B2B2C clinician portal (web admin app)
- FHIR / Epic / Cerner / Athena integration
- FDA Q-Sub or 510(k) submission
- Full standalone watchOS app (workout tracking, on-watch coaching, independent connectivity)
- Real BLE chest strap integration (Polar H10, Wahoo Tickr) — deferred to v1.5
- Internationalization beyond US English
- Web app (marketing site only, no web product surface)
- Apple Health / Google Fit write-back
- Family Sharing / caregiver views
- Push notification marketing campaigns (transactional pushes only)
- Voice input / TTS output (text-only chat)
- Caregiver mode, emergency contact escalation beyond "call 911" hardcoded response
- Insurance integration, claims data, provider directories

---

## 14. Open items requiring user decision later

These are not blocking the implementation plan but will need decisions before launch:

1. Trademark clearance for "Cadence" — USPTO and EU search; alternate names if unavailable (Steady, Cardia, or new)
2. Apple Developer Program account ownership (personal vs. forming an LLC for liability separation — recommend LLC before App Store submission)
3. Privacy policy + terms of service drafting — recommend Termly or hand-written with legal review
4. Marketing site stack (Astro / Next.js static) and domain registration
5. Designer engagement (or AI design pass via `frontend-design` skill) for the Cadence visual identity
6. Bedrock model choice tuning — Claude Haiku for routine vs. Sonnet for premium; A/B test in v1.1
7. First 20 testers for TestFlight + Play Internal — recruit through cardiac rehab program networks or recovery subreddits

---

## 15. Success criteria for v1

This is a learning / portfolio project. "Done" means:

- Both apps installable on personal iPhone and Android devices via TestFlight and Play Internal
- HealthKit + Health Connect data flowing into the app correctly
- All three AI tiers functional, with the safety classifier passing its regression suite at 100%
- AWS backend deployed in two regions with monitoring active and CI gates green
- Documentation complete: README, ADRs, threat model, runbooks, this spec
- Security scan clean (no high/critical CVEs in dependencies, no Semgrep blockers)
- Coverage gates met (90% on `ai/`, 70% overall)
- Public GitHub repo with clean commit history, ready to share as a portfolio link

No revenue target. No user count target. No marketing launch.

---

## 16. Out of scope for the implementation plan

This spec is the architecture. The implementation plan (next document) will sequence the build order. Topics the plan will cover:

- Build sequence (which features ship first to derisk the hardest pieces)
- Native module implementation order (HealthKit first, then Health Connect, then on-device LLMs)
- AWS environment setup (dev sandbox, staging, prod)
- Watch companion build sequence
- CI/CD bring-up
- Pre-launch checklist (privacy policy, App Store metadata, screenshots, App Review notes)
