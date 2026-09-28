# Contributing to Aura AI Coach

Thank you for your interest in contributing to **Aura AI Coach**! We welcome open-source contributions, bug reports, documentation updates, and test additions.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hoomanp/aura-ai-coach.git
   cd aura-ai-coach
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify the test suite and type safety:**
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```

4. **Run the development server in Demo Mode:**
   ```bash
   APP_ENV=demo npx expo start
   ```

## Pull Request Guidelines

1. **Branch Naming:**
   - `feat/feature-name`
   - `fix/bug-description`
   - `test/test-suite-name`
   - `docs/documentation-update`

2. **Quality Gates:**
   - All tests must pass: `npm test`
   - Zero TypeScript errors: `npm run typecheck`
   - Zero ESLint errors: `npm run lint`
   - Zero high/critical npm vulnerabilities: `npm audit`

3. **Medical Safety Considerations:**
   - Any AI engine changes that modify medical advice must preserve conservative guardrails and emergency triage prompts.
   - Do **NOT** commit credentials, distribution certificates (`.p12`), or provisioning profiles.
