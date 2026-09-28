# Cadence — Plan 1: Foundation & Repo Bootstrap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the new `cadence` git repo with a working Expo Dev Client skeleton, CI pipeline, ADR scaffolding, and zero Abbott branding. Empty app boots on iOS simulator and Android emulator. CI runs green on first push.

**Architecture:** Standalone Expo Dev Client app initialized fresh (not migrated). Single-source-of-truth TypeScript strict + ESLint + Prettier. Jest + React Native Testing Library for tests. GitHub Actions for lint/typecheck/test. Husky + lint-staged + Gitleaks for pre-commit safety. Architecture Decision Records (ADRs) in `docs/adrs/`.

**Tech Stack:** Expo SDK ~55, React Native 0.83.x, TypeScript 5.9 strict, React Navigation v7 (bottom tabs), Jest, React Native Testing Library, ESLint, Prettier, Husky, lint-staged, Gitleaks, GitHub Actions, EAS CLI.

**Prerequisites:**
- Node.js 20+ installed (`node --version`)
- pnpm or npm available (this plan uses npm to match the existing Abbott demo conventions)
- Xcode 16+ installed with iOS 18 simulator
- Android Studio with an emulator (API 34+)
- `eas-cli` installed globally (`npm install -g eas-cli`)
- Expo account (free at expo.dev) — required for `eas init`
- A GitHub account with permission to create a new repo

**Target directory:** `/Users/hoomanparta/Documents/Codes/medical/cadence/`

**Out of scope for this plan (deferred to later plans):**
- AWS Amplify Gen 2 setup → Plan 2
- HealthKit / Health Connect native modules → Plan 3
- Real dashboard data → Plan 4
- AI router code → Plan 5
- Security hardening (cert pinning, App Attest) → Plan 11
- Full CI matrix (E2E, SAST, dependency scans) → Plan 13

---

## File Structure

After this plan, the new repo will look like:

```
cadence/
├── .github/
│   └── workflows/
│       └── ci.yml                          ← lint + typecheck + unit tests
├── .husky/
│   └── pre-commit                          ← lint-staged + gitleaks
├── .vscode/
│   └── settings.json                       ← format-on-save, editor config
├── docs/
│   ├── adrs/
│   │   ├── 0000-template.md                ← Nygard ADR template
│   │   └── 0001-expo-dev-client.md         ← first ADR
│   └── superpowers/                        ← reserved for future spec/plan files
├── src/
│   ├── app/
│   │   └── Root.tsx                        ← top-level navigation
│   ├── features/
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx         ← placeholder
│   │   ├── history/
│   │   │   └── HistoryScreen.tsx           ← placeholder
│   │   ├── coach/
│   │   │   └── CoachScreen.tsx             ← placeholder
│   │   └── settings/
│   │       └── SettingsScreen.tsx          ← placeholder
│   ├── shared/
│   │   ├── theme/
│   │   │   ├── colors.ts                   ← Cadence color tokens
│   │   │   ├── spacing.ts                  ← spacing scale
│   │   │   ├── typography.ts               ← type scale
│   │   │   └── index.ts                    ← barrel export
│   │   └── components/
│   │       └── ScreenContainer.tsx         ← shared layout primitive
│   └── __tests__/
│       └── Root.test.tsx                   ← smoke test
├── App.tsx                                  ← entry point, mounts Root
├── app.json                                 ← Expo config, bundle IDs, dev client
├── eas.json                                 ← EAS build profiles (development first)
├── babel.config.js
├── eslint.config.mjs                        ← flat config (ESLint 9)
├── .prettierrc.json
├── .prettierignore
├── .gitignore
├── .gitleaks.toml
├── jest.config.js
├── jest.setup.ts
├── metro.config.js
├── package.json
├── tsconfig.json
├── index.ts                                 ← Expo entry
├── README.md                                ← quickstart + status
└── LICENSE                                  ← MIT or chosen license
```

---

## Tasks

### Task 1: Create repo directory and initialize git

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/.gitignore`

- [ ] **Step 1: Create the directory and initialize git**

```bash
mkdir -p /Users/hoomanparta/Documents/Codes/medical/cadence
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git init -b main
```

Expected output: `Initialized empty Git repository in .../cadence/.git/`

- [ ] **Step 2: Create `.gitignore` (Node + Expo + macOS)**

Create file `/Users/hoomanparta/Documents/Codes/medical/cadence/.gitignore` with content:

```gitignore
# OS
.DS_Store
Thumbs.db

# Editors
.idea/
.vscode/*
!.vscode/settings.json

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Expo
.expo/
.expo-shared/
dist/
web-build/

# Native build artifacts
ios/build/
ios/Pods/
ios/*.xcworkspace/xcuserdata/
android/.gradle/
android/build/
android/app/build/
android/local.properties

# Env
.env
.env.local
.env.*.local
!.env.example

# Test / coverage
coverage/

# EAS
.eas/

# TypeScript
*.tsbuildinfo

# Misc
*.log
*.pem

# Secrets (defense in depth)
credentials/
*.p12
*.mobileprovision
```

- [ ] **Step 3: First commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add .gitignore
git commit -m "chore: initialize cadence repo with gitignore"
```

Expected output: commit hash printed, `1 file changed`.

---

### Task 2: Initialize package.json with exact dependency versions

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/package.json`

- [ ] **Step 1: Create `package.json`**

Create file `/Users/hoomanparta/Documents/Codes/medical/cadence/package.json` with content:

```json
{
  "name": "cadence",
  "version": "0.1.0",
  "main": "index.ts",
  "private": true,
  "scripts": {
    "start": "expo start --dev-client",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "prepare": "husky"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.1.1",
    "@react-navigation/bottom-tabs": "^7.15.9",
    "@react-navigation/native": "^7.2.2",
    "expo": "~55.0.6",
    "expo-dev-client": "~5.0.0",
    "expo-status-bar": "~55.0.4",
    "react": "19.2.0",
    "react-native": "0.83.2",
    "react-native-safe-area-context": "~5.0.0",
    "react-native-screens": "^4.24.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.0.0",
    "@types/jest": "^29.5.12",
    "@types/react": "~19.2.2",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react": "^7.35.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-native": "^4.1.0",
    "husky": "^9.0.0",
    "jest": "^29.7.0",
    "jest-expo": "~55.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.3.0",
    "ts-jest": "^29.2.0",
    "typescript": "~5.9.2"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm install
```

Expected output: `node_modules/` populated, `package-lock.json` created, no peer-dependency errors. Warnings about deprecated transitive deps are acceptable. If `npm install` fails on a specific package version, note the failure and update the version in `package.json` to the latest compatible — do not silently change architecture.

- [ ] **Step 3: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add package.json package-lock.json
git commit -m "chore: add package.json with pinned core dependencies"
```

---

### Task 3: Configure TypeScript strict mode

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/tsconfig.json`

- [ ] **Step 1: Create `tsconfig.json`**

Create file with content:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "jsx": "react-native",
    "lib": ["ES2023"],
    "target": "ES2022",
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/app/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "babel.config.js", "metro.config.js"]
}
```

- [ ] **Step 2: Verify typecheck runs (it will fail on missing files; that is expected)**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx tsc --noEmit
```

Expected output: errors about missing files (no source code exists yet). The fact that `tsc` ran at all and accepted the config is the success signal.

- [ ] **Step 3: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add tsconfig.json
git commit -m "chore: add strict tsconfig with path aliases"
```

---

### Task 4: Configure ESLint (flat config) and Prettier

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/eslint.config.mjs`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/.prettierrc.json`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/.prettierignore`

- [ ] **Step 1: Create `eslint.config.mjs`**

```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'coverage/**', 'ios/**', 'android/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'react-native/no-unused-styles': 'error',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-raw-text': 'off',
    },
  },
];
```

- [ ] **Step 2: Create `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 3: Create `.prettierignore`**

```
node_modules/
.expo/
dist/
ios/
android/
coverage/
package-lock.json
*.log
```

- [ ] **Step 4: Run lint and prettier to verify (no files yet — empty success)**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm run lint || true
npm run format:check
```

Expected output: `lint` exits 0 (no files matched) or with zero rule violations. `format:check` reports no files to check or all files formatted.

- [ ] **Step 5: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add eslint.config.mjs .prettierrc.json .prettierignore
git commit -m "chore: configure eslint flat config and prettier"
```

---

### Task 5: Configure Jest with React Native preset

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/jest.config.js`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/jest.setup.ts`

- [ ] **Step 1: Create `jest.config.js`**

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/__tests__/**'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
```

(Coverage thresholds intentionally zero in Plan 1; raised in Plan 13.)

- [ ] **Step 2: Create `jest.setup.ts`**

```typescript
// jest-expo handles the basic mocks for react-native.
// @testing-library/react-native v13+ auto-registers custom matchers
// (toBeOnTheScreen, toHaveTextContent, etc.) on first import — no extend-expect needed.
```

- [ ] **Step 3: Verify Jest discovers no tests yet (graceful)**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest --passWithNoTests
```

Expected output: `No tests found, exiting with code 0`.

- [ ] **Step 4: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add jest.config.js jest.setup.ts
git commit -m "chore: configure jest with jest-expo preset"
```

---

### Task 6: Create theme tokens (Cadence palette placeholder)

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/theme/colors.ts`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/theme/spacing.ts`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/theme/typography.ts`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/theme/index.ts`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/theme/__tests__/colors.test.ts`

- [ ] **Step 1: Write failing test for color tokens**

Create `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/theme/__tests__/colors.test.ts`:

```typescript
import { Colors } from '@shared/theme';

describe('Colors', () => {
  test('exposes the required semantic tokens', () => {
    expect(Colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(Colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(Colors.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(Colors.textSecondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(Colors.success).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(Colors.warning).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(Colors.danger).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test('does not contain Abbott Blue', () => {
    const abbottBlue = '#00a9e0';
    Object.values(Colors).forEach((value) => {
      expect(value.toLowerCase()).not.toBe(abbottBlue);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest src/shared/theme/__tests__/colors.test.ts
```

Expected: FAIL — `Cannot find module '@shared/theme'`.

- [ ] **Step 3: Create `colors.ts`**

Create `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/theme/colors.ts`:

```typescript
/**
 * Cadence color palette — placeholder.
 * Finalized palette comes from design pass (see open items in spec §14).
 * Deliberately distinct from Abbott Blue (#00A9E0) to make any drift visible.
 */
export const Colors = {
  primary: '#2E5BFF',     // Cadence Indigo — calm, trustworthy, distinct from medical-device blues
  secondary: '#FF8A3D',   // Recovery Amber — warmth, encouragement
  background: '#F7F8FA',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  legalGray: '#94A3B8',
} as const;

export type ColorToken = keyof typeof Colors;
```

- [ ] **Step 4: Create `spacing.ts`**

```typescript
export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingToken = keyof typeof Spacing;
```

- [ ] **Step 5: Create `typography.ts`**

```typescript
import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' } as TextStyle,
  h2: { fontSize: 20, fontWeight: '600' } as TextStyle,
  body: { fontSize: 16, fontWeight: '400' } as TextStyle,
  caption: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary } as TextStyle,
  legal: { fontSize: 11, color: Colors.legalGray, textAlign: 'center' } as TextStyle,
} as const;

export type TypographyToken = keyof typeof Typography;
```

- [ ] **Step 6: Create barrel export `index.ts`**

```typescript
export { Colors } from './colors';
export type { ColorToken } from './colors';
export { Spacing } from './spacing';
export type { SpacingToken } from './spacing';
export { Typography } from './typography';
export type { TypographyToken } from './typography';
```

- [ ] **Step 7: Run test to verify it passes**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest src/shared/theme/__tests__/colors.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 8: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add src/shared/theme/
git commit -m "feat(theme): add Cadence color/spacing/typography tokens with no-Abbott-Blue guard test"
```

---

### Task 7: Create `ScreenContainer` shared layout primitive

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/components/ScreenContainer.tsx`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/shared/components/__tests__/ScreenContainer.test.tsx`

- [ ] **Step 1: Write failing test**

Create test file:

```typescript
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ScreenContainer } from '../ScreenContainer';

describe('ScreenContainer', () => {
  test('renders children', () => {
    render(
      <ScreenContainer>
        <Text>Hello Cadence</Text>
      </ScreenContainer>,
    );
    expect(screen.getByText('Hello Cadence')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest src/shared/components/__tests__/ScreenContainer.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the component**

```typescript
import React, { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '@shared/theme';

interface ScreenContainerProps {
  padded?: boolean;
}

export function ScreenContainer({
  children,
  padded = true,
}: PropsWithChildren<ScreenContainerProps>) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1 },
  padded: { padding: Spacing.m },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest src/shared/components/__tests__/ScreenContainer.test.tsx
```

Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add src/shared/components/
git commit -m "feat(shared): add ScreenContainer layout primitive with test"
```

---

### Task 8: Create four placeholder feature screens

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/features/dashboard/DashboardScreen.tsx`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/features/history/HistoryScreen.tsx`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/features/coach/CoachScreen.tsx`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/features/settings/SettingsScreen.tsx`

Each screen is intentionally minimal in Plan 1. Real implementations land in Plans 4–9.

- [ ] **Step 1: Create `DashboardScreen.tsx`**

```typescript
import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Typography } from '@shared/theme';

export function DashboardScreen() {
  return (
    <ScreenContainer>
      <Text style={Typography.h1}>Dashboard</Text>
      <Text style={Typography.caption}>Health data will appear here.</Text>
    </ScreenContainer>
  );
}
```

- [ ] **Step 2: Create `HistoryScreen.tsx`**

```typescript
import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Typography } from '@shared/theme';

export function HistoryScreen() {
  return (
    <ScreenContainer>
      <Text style={Typography.h1}>History</Text>
      <Text style={Typography.caption}>7-day trends will appear here.</Text>
    </ScreenContainer>
  );
}
```

- [ ] **Step 3: Create `CoachScreen.tsx`**

```typescript
import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Typography } from '@shared/theme';

export function CoachScreen() {
  return (
    <ScreenContainer>
      <Text style={Typography.h1}>Coach</Text>
      <Text style={Typography.caption}>AI coach chat will appear here.</Text>
    </ScreenContainer>
  );
}
```

- [ ] **Step 4: Create `SettingsScreen.tsx`**

```typescript
import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Typography } from '@shared/theme';

export function SettingsScreen() {
  return (
    <ScreenContainer>
      <Text style={Typography.h1}>Settings</Text>
      <Text style={Typography.caption}>Account, subscription, privacy.</Text>
    </ScreenContainer>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add src/features/
git commit -m "feat(screens): scaffold dashboard/history/coach/settings placeholders"
```

---

### Task 9: Create Root navigation (bottom tabs)

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/app/Root.tsx`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/src/__tests__/Root.test.tsx`

- [ ] **Step 1: Write failing smoke test**

Create `/Users/hoomanparta/Documents/Codes/medical/cadence/src/__tests__/Root.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Root } from '@app/Root';

describe('Root', () => {
  test('mounts without crashing and shows Dashboard by default', () => {
    render(<Root />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest src/__tests__/Root.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `Root.tsx`**

Create `/Users/hoomanparta/Documents/Codes/medical/cadence/src/app/Root.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DashboardScreen } from '@features/dashboard/DashboardScreen';
import { HistoryScreen } from '@features/history/HistoryScreen';
import { CoachScreen } from '@features/coach/CoachScreen';
import { SettingsScreen } from '@features/settings/SettingsScreen';
import { Colors } from '@shared/theme';

export type RootTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Coach: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, React.ComponentProps<typeof Ionicons>['name']> = {
  Dashboard: 'heart',
  History: 'bar-chart',
  Coach: 'chatbubble-ellipses',
  Settings: 'settings',
};

export function Root() {
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
        <Tab.Screen name="Coach" component={CoachScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest src/__tests__/Root.test.tsx
```

Expected: PASS, 1 test. (If it fails because React Navigation requires additional test setup, add the following to `jest.setup.ts`: `jest.mock('react-native-screens', () => ({ enableScreens: () => {}, Screen: () => null, ScreenContainer: () => null }));` — but typically `jest-expo` handles this.)

- [ ] **Step 5: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add src/app/Root.tsx src/__tests__/Root.test.tsx
git commit -m "feat(nav): add Root bottom-tab navigator with smoke test"
```

---

### Task 10: Create `App.tsx` and `index.ts` entry points

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/App.tsx`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/index.ts`

- [ ] **Step 1: Create `App.tsx`**

```typescript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Root } from '@app/Root';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <Root />
    </>
  );
}
```

- [ ] **Step 2: Create `index.ts`**

```typescript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

- [ ] **Step 3: Run typecheck to verify**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx jest
```

Expected: 3 test files, all passing.

- [ ] **Step 5: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add App.tsx index.ts
git commit -m "feat(app): wire App entry point to Root navigator"
```

---

### Task 11: Configure `app.json` for Expo Dev Client + bundle IDs

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/app.json`

- [ ] **Step 1: Create `app.json`**

```json
{
  "expo": {
    "name": "Cadence",
    "slug": "cadence",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.cadencecoach.app",
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.cadencecoach.app",
      "versionCode": 1
    },
    "plugins": ["expo-dev-client"]
  }
}
```

(HealthKit usage strings, BLE strings, permissions deliberately deferred to Plan 3, when the native modules that need them land.)

- [ ] **Step 2: Verify app.json validity**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx expo config --type public > /dev/null
```

Expected: no error output (stdout suppressed).

- [ ] **Step 3: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add app.json
git commit -m "chore(expo): add app.json with cadencecoach bundle IDs and dev-client plugin"
```

---

### Task 12: Configure `eas.json` with development profile

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/eas.json`

- [ ] **Step 1: Create `eas.json`**

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 2: Initialize EAS project (interactive — one-time)**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
eas init
```

Expected: prompts for Expo account login (if not already), creates an EAS project, writes `projectId` into `app.json` under `expo.extra.eas.projectId`.

If you don't have an Expo account yet, sign up at https://expo.dev (free) and run `eas login`. If you want to skip this step temporarily and only run locally, skip `eas init` and only the EAS Build steps later in this task will be deferred.

- [ ] **Step 3: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add eas.json app.json
git commit -m "chore(eas): add development/preview/production build profiles and init project"
```

---

### Task 13: Install and configure Husky + lint-staged + Gitleaks

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/.husky/pre-commit`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/.gitleaks.toml`
- Modify: `/Users/hoomanparta/Documents/Codes/medical/cadence/package.json` (add `lint-staged` config)

- [ ] **Step 1: Initialize Husky**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npx husky init
```

Expected: creates `.husky/pre-commit` with a default `npm test` line and adds `prepare` script to package.json (already present).

- [ ] **Step 2: Replace `.husky/pre-commit` content**

Replace the contents of `/Users/hoomanparta/Documents/Codes/medical/cadence/.husky/pre-commit` with:

```bash
npx lint-staged
gitleaks protect --staged --no-banner --redact
```

(Gitleaks must be installed on the developer machine. Install via `brew install gitleaks` on macOS. If gitleaks is not available locally, comment out the `gitleaks` line in the hook and add a note in README — Plan 11 will make it required.)

- [ ] **Step 3: Add `lint-staged` config to `package.json`**

Edit `/Users/hoomanparta/Documents/Codes/medical/cadence/package.json` to add at the end of the top-level object (before the closing `}`):

```json
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
```

Final structure of `package.json` should be (showing only the relevant tail):

```json
  "devDependencies": {
    ...
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

- [ ] **Step 4: Create `.gitleaks.toml` baseline config**

```toml
title = "Cadence Gitleaks Config"

[extend]
useDefault = true

[allowlist]
description = "Allow common false positives"
paths = [
  '''package-lock\.json''',
  '''node_modules/''',
  '''ios/Pods/''',
  '''android/build/''',
]
```

- [ ] **Step 5: Verify hook runs (intentional trigger)**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
echo "// noop" > _hook_check.ts
git add _hook_check.ts
git commit -m "chore: verify pre-commit hook" || true
```

Expected: hook runs, lint-staged formats `_hook_check.ts`, gitleaks scans, commit succeeds (or fails cleanly if gitleaks is not installed locally).

Then clean up:

```bash
git rm _hook_check.ts
git commit -m "chore: remove hook check file"
```

- [ ] **Step 6: Commit the husky + gitleaks config**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add .husky/ .gitleaks.toml package.json
git commit -m "chore(security): add husky pre-commit with lint-staged and gitleaks"
```

---

### Task 14: Create GitHub Actions CI workflow

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: ci

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Typecheck
        run: npm run typecheck

      - name: Unit tests
        run: npm test -- --ci --coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
          retention-days: 7
```

- [ ] **Step 2: Verify the workflow file is valid YAML**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
```

Expected: no output (valid YAML).

- [ ] **Step 3: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add .github/workflows/ci.yml
git commit -m "ci: add lint+typecheck+test workflow"
```

---

### Task 15: Create ADR template and first ADR

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/docs/adrs/0000-template.md`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/docs/adrs/0001-expo-dev-client.md`

- [ ] **Step 1: Create the ADR template**

```markdown
# ADR NNNN: <short title>

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Deciders:** <names>

## Context

What is the issue motivating this decision? What forces are at play?

## Decision

What is the chosen approach?

## Consequences

What becomes easier? What becomes harder? What are the trade-offs accepted?

## Alternatives Considered

- **Alternative A:** brief description and why rejected
- **Alternative B:** brief description and why rejected
```

- [ ] **Step 2: Create ADR-0001**

```markdown
# ADR 0001: Use Expo Dev Client over bare React Native or fully native

- **Status:** Accepted
- **Date:** 2026-05-26
- **Deciders:** Solo founder

## Context

Cadence needs to ship on iOS and Android with: HealthKit / Health Connect access, BLE access (future), Apple Foundation Models bridge (iOS 26+), Gemini Nano bridge (Android AICore), biometric authentication, secure storage, and Watch companions. The team is one engineer working without a fixed deadline.

Three viable approaches were considered:
1. Expo Dev Client + selective native modules
2. Bare React Native (eject from Expo entirely)
3. Fully native: SwiftUI for iOS + Jetpack Compose for Android

## Decision

Use Expo Dev Client with selective Swift / Kotlin native modules for the platform-specific features that Expo SDK does not cover.

## Consequences

**Easier:**
- ~70% code reuse across iOS and Android
- Keep EAS Build, EAS Update, and Expo's tooling
- Stay on TypeScript for the majority of the app
- Single-engineer-feasible cadence

**Harder:**
- Some Expo SDK APIs are limited; the on-device LLM bridges and HealthKit observers require custom native code
- Native modules require Swift / Kotlin proficiency
- Debugging native module interactions across JS bridge has a learning curve

**Trade-offs accepted:**
- We give up the deepest platform UX (Liquid Glass, Live Activities beyond basics, watchOS independent apps) in favor of velocity
- We accept that some hot paths may eventually motivate native rewrites of specific screens

## Alternatives Considered

- **Bare React Native:** Rejected because losing EAS Build / Update means self-hosting CI/CD signing and OTA infrastructure — work that doesn't serve the product.
- **Fully native (SwiftUI + Jetpack Compose):** Rejected because two codebases double the maintenance burden without a proportional UX payoff for a solo developer. Reconsidered if team grows past four engineers.
- **Flutter or KMP:** Rejected because existing TypeScript + React Native investment is non-trivial and Flutter's HealthKit / Health Connect community libraries are weaker.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add docs/adrs/
git commit -m "docs(adr): add ADR template and ADR-0001 Expo Dev Client decision"
```

---

### Task 16: Create README with quickstart

**Files:**
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/README.md`
- Create: `/Users/hoomanparta/Documents/Codes/medical/cadence/LICENSE` (MIT)

- [ ] **Step 1: Create `README.md`**

```markdown
# Cadence

A cardiac wellness coach for people in heart recovery. iOS, Android, Apple Watch, and Wear OS. Powered by HealthKit, Health Connect, and a three-tier AI coach (deterministic rules + on-device small models + Anthropic Claude via AWS Bedrock).

> Cadence is a wellness app, not a medical device. It does not diagnose, treat, or monitor any medical condition. Always follow your physician's guidance.

## Status

Plan 1 of 13 complete. Working Expo Dev Client skeleton with CI. See `docs/superpowers/plans/` for the build roadmap and `docs/superpowers/specs/` for the architecture spec (copy in from sibling repo if not yet migrated).

## Quickstart

Requirements:
- Node 20+
- Xcode 16+ with iOS 18 simulator (for iOS development)
- Android Studio with an emulator API 34+ (for Android development)
- `eas-cli` installed globally (`npm i -g eas-cli`)
- Expo account (free, https://expo.dev)
- `gitleaks` installed (`brew install gitleaks` on macOS)

Install:

```bash
git clone <repo-url>
cd cadence
npm install
```

Run the app:

```bash
# iOS simulator
npm run ios

# Android emulator
npm run android

# Metro bundler only (with a Dev Client build already installed)
npm start
```

Quality checks:

```bash
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Jest
npm run format:check   # Prettier check
```

## Architecture

See `docs/superpowers/specs/2026-05-26-cadence-v2-design.md` for the full design. Key choices:

- Mobile: Expo Dev Client + React Native + native Swift/Kotlin modules
- Backend: AWS Amplify Gen 2 (Cognito + AppSync + DynamoDB + Lambda + S3 + Bedrock + KMS)
- AI: three-tier router — rules + on-device (Foundation Models / Gemini Nano) + cloud (Bedrock Claude)
- Monetization: freemium via RevenueCat ($8/mo, $60/yr Pro)
- Launch market: US-only, English

## License

MIT — see `LICENSE`.
```

- [ ] **Step 2: Create `LICENSE`**

```
MIT License

Copyright (c) 2026 <Your Name>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Replace `<Your Name>` with your actual name before committing.

- [ ] **Step 3: Commit**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git add README.md LICENSE
git commit -m "docs: add README quickstart and MIT license"
```

---

### Task 17: Local verification — full quality pipeline

**Goal:** confirm everything that runs in CI also runs clean locally before pushing.

- [ ] **Step 1: Run lint**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm run lint
```

Expected: exits 0, no errors.

- [ ] **Step 2: Run prettier check**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm run format:check
```

Expected: exits 0, "All matched files use Prettier code style".

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm run typecheck
```

Expected: exits 0, no errors.

- [ ] **Step 4: Run full test suite**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm test
```

Expected: 3 test files (`colors.test.ts`, `ScreenContainer.test.tsx`, `Root.test.tsx`), all passing. Coverage report printed.

- [ ] **Step 5: Boot on iOS simulator**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm run ios
```

Expected: iOS simulator launches, Cadence app appears, bottom tabs render (Dashboard / History / Coach / Settings), each tab shows its placeholder text. No red error screen.

- [ ] **Step 6: Boot on Android emulator**

(Ensure an Android emulator is running first, e.g., via Android Studio Device Manager.)

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
npm run android
```

Expected: Android emulator shows Cadence app with the same four tabs. No red error screen.

If either boot fails because of a missing native module that should be in Plan 3, document the error in the README "Known issues" section and proceed — Plan 1 is about scaffold, not full native runtime parity.

- [ ] **Step 7: Commit any iOS/Android build artifacts that should be tracked**

This step only applies if `npm run ios` / `npm run android` generated changes outside of `ios/` and `android/` directories (e.g., a `metro.config.js` or `babel.config.js` Expo created on first run).

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git status
# If new files outside ios/ android/:
git add <file>
git commit -m "chore: add generated <file> from first build"
```

---

### Task 18: Create GitHub repo and push

**Goal:** trigger CI to run end-to-end.

- [ ] **Step 1: Create remote GitHub repo (CLI)**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
gh repo create cadence --private --source=. --remote=origin --description "Cardiac wellness coach for iOS/Android/Watch — Plan 1 foundation"
```

(If `gh` CLI is not authenticated, run `gh auth login` first. If you do not want to use the GitHub CLI, create the repo manually at https://github.com/new and then run `git remote add origin <url>`.)

- [ ] **Step 2: Push main branch**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git push -u origin main
```

Expected: push succeeds, GitHub Actions `ci` workflow starts.

- [ ] **Step 3: Watch CI run**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
gh run watch
```

Expected: `ci / quality` job completes green within ~5 minutes. All steps (Install, Lint, Format check, Typecheck, Unit tests) pass.

If any step fails: fix locally, push a new commit, re-watch. Do not move on to Plan 2 until CI is green.

- [ ] **Step 4: Final verification commit (no-op marker for plan completion)**

```bash
cd /Users/hoomanparta/Documents/Codes/medical/cadence
git tag plan-01-foundation-complete -m "Plan 1 foundation complete: app boots, CI green, ADR-0001 documented"
git push --tags
```

---

## Self-Review Notes

This plan was reviewed against the spec at `docs/superpowers/specs/2026-05-26-cadence-v2-design.md` immediately after writing. Findings:

**Spec coverage in this plan (intentionally partial — Plan 1 is foundation only):**
- §2 Locked decisions 1, 2, 5, 7, 9 are reflected in repo bootstrap, naming, and ADR-0001
- §8.1 Module structure (`features/`, `shared/`, `ai/` — but `ai/` is deferred to Plan 5) is established
- §10.1 GitHub Actions pipeline — minimum viable subset (lint + typecheck + test) shipped; full matrix in Plan 13
- §10.3 ADRs — template plus first ADR shipped
- §11 Testing — Jest + RNTL + one smoke test established; coverage gates deferred to Plan 13
- §12 Migration table — branding strip honored (no Abbott trademarks, distinct color palette, new bundle IDs)

**Deliberately deferred to later plans (not gaps):**
- AWS Amplify Gen 2 → Plan 2
- HealthKit / Health Connect native modules and their Info.plist usage strings → Plan 3
- Dashboard / History real data → Plan 4
- AI router → Plans 5-7
- Auth flow → Plan 8
- RevenueCat → Plan 9
- Watch companion → Plan 10
- Cert pinning, App Attest, KMS, Semgrep, Snyk → Plan 11
- CCPA/MHMDA flows → Plan 12
- E2E (Maestro), Sentry, CloudWatch, full CI matrix → Plan 13

**Placeholder scan:** No `TBD` / `TODO` / `implement later` / placeholder comments in this plan. The "Cadence palette" colors in Task 6 are intentional working values, marked as such in the file comment.

**Type consistency:** `Root` function exported from `@app/Root`, imported by `App.tsx` and the test. `ScreenContainer` props consistent across uses. Color tokens defined once in `colors.ts`, imported via barrel.

---

## Done state for Plan 1

When all 18 tasks are checked:

- New `cadence` git repo exists at `/Users/hoomanparta/Documents/Codes/medical/cadence/` with clean commit history
- App boots on both iOS simulator and Android emulator showing four bottom-tab placeholders
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check` all exit 0
- Pre-commit hook runs lint-staged and gitleaks
- GitHub Actions `ci` workflow is green on `main`
- ADR-0001 documents the Expo Dev Client decision
- README contains a working quickstart for a new developer
- Git tag `plan-01-foundation-complete` marks the milestone

Next: execute this plan, then return for Plan 2 (AWS Amplify Gen 2 baseline).
