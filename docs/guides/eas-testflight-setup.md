# EAS + TestFlight Setup Guide

One-time setup to get Aura AI Coach building and distributing to iOS devices via TestFlight.

**Bundle identifier:** `com.abbott.aura-ai-coach`

---

## Prerequisites

- Mac with Xcode installed (required for iOS signing)
- Apple Developer account with **Account Holder** or **Admin** role
- Node.js + npm installed
- Expo CLI installed (`npm install -g expo-cli`)

---

## Step 1 — Install EAS CLI

```bash
npm install -g eas-cli
```

Verify:
```bash
eas --version
```

---

## Step 2 — Log in to Expo

```bash
eas login
```

Enter your Expo account credentials. If you don't have one, create a free account at [expo.dev](https://expo.dev).

---

## Step 3 — Initialize EAS in the project

```bash
cd /Users/hoomanparta/Documents/Codes/medical/Abbott/aura-ai-coach
eas init
```

This will:
- Create an EAS project linked to your Expo account
- Write a `projectId` into `app.json` automatically

---

## Step 4 — Configure Apple Developer credentials

Run the credentials setup:

```bash
eas credentials --platform ios
```

Choose **"Add a new provisioning profile"** when prompted. EAS will walk you through:

1. **Apple ID login** — EAS opens a browser to authenticate with Apple
2. **Bundle identifier registration** — EAS registers `com.abbott.aura-ai-coach` in your Apple Developer portal automatically
3. **Distribution certificate** — EAS creates or reuses an existing iOS Distribution Certificate
4. **Provisioning profile** — EAS creates an **Ad Hoc** profile for internal TestFlight distribution

> **Tip:** If you see "Two-factor authentication required", complete it in the browser — EAS handles the rest.

---

## Step 5 — Enable HealthKit capability in Apple Developer portal

HealthKit must be manually enabled (EAS cannot do this automatically):

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles → Identifiers**
3. Find `com.abbott.aura-ai-coach`
4. Scroll to **Capabilities** and enable **HealthKit**
5. Save

---

## Step 6 — Trigger your first demo build

From the project root:

```bash
eas build --platform ios --profile demo
```

This will:
- Bundle the app with `APP_ENV=demo`
- Sign it with your Ad Hoc profile
- Upload the `.ipa` to Expo's build servers (takes ~10–15 minutes)
- Automatically submit to TestFlight when done

Watch the build log at the URL printed in the terminal, or at [expo.dev/builds](https://expo.dev/builds).

---

## Step 7 — Add testers in TestFlight

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Select **Aura AI Coach** under My Apps
3. Navigate to **TestFlight → Internal Testing**
4. Click **+** and add tester emails
5. Each tester receives an email invite → they install **TestFlight** from the App Store → accept invite → install the app

> **Internal testing** supports up to 100 testers and does not require App Store review. Builds are available within minutes of upload.

---

## Subsequent Builds

After the one-time setup above, all future builds are a single command:

```bash
eas build --platform ios --profile demo
```

To push a new build to the same TestFlight group, testers will see an update notification automatically in the TestFlight app.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `eas: command not found` | Re-run `npm install -g eas-cli` and restart terminal |
| "No provisioning profile found" | Re-run `eas credentials --platform ios` |
| HealthKit entitlement error during build | Confirm HealthKit is enabled in Step 5 |
| Build succeeds but not in TestFlight | Check [appstoreconnect.apple.com](https://appstoreconnect.apple.com) — processing takes 5–10 min |
| Two-factor auth loop | Complete 2FA in the browser EAS opens, do not close it |

---

## Summary of Commands

```bash
npm install -g eas-cli          # one-time
eas login                       # one-time
eas init                        # one-time, run from project root
eas credentials --platform ios  # one-time
eas build --platform ios --profile demo  # every release
```
