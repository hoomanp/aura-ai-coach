# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

The Aura AI Coach project takes security and patient data privacy seriously.

If you believe you have discovered a vulnerability, security flaw, or potential PII/PHI leakage vector in this repository:

1. **Do NOT open a public GitHub issue.**
2. Send an email to the repository owner via GitHub Security Advisories or privately contact the maintainer at `hoomanparta@gmail.com` (or submit a Private Vulnerability Report via the GitHub repository's **Security** tab).
3. Include detailed steps to reproduce the issue, environment information, and relevant logs or proof of concept.

### Our Commitment

- We will acknowledge receipt of your report within 48 hours.
- We will provide a triage update and an estimated remediation timeline.
- We will coordinate public disclosure after a patch has been merged and released.

## Security Practices in this Repository

- **Zero Cleartext Secrets:** No production private keys, provisioning profiles, or API tokens are tracked in git.
- **Input Sanitization:** Telemetry values and patient IDs undergo strict schema validation and sanitization prior to ingestion by AI engines or storage services.
- **Dependency Auditing:** Automated `npm audit` and vulnerability scanning are enforced via CI workflows (see below).

## Dependency Audit Posture

CI gates on `npm audit --audit-level=critical` — **zero critical findings** — and fails the build on any new critical advisory.

Two high-severity advisories are currently reported by npm against this dependency tree. Both originate in third-party toolchain packages where **no patched version has been published upstream yet** (the latest published release of each package is itself within the affected range), so they cannot be resolved by overrides or upgrades at this time:

| Advisory | Package | Affected range | Exposure in this repository | Remediation status |
| :--- | :--- | :--- | :--- | :--- |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | `braces` | `<= 3.0.3` (stack-exhaustion DoS via deeply nested patterns) | Build/test toolchain only (`jest → micromatch → braces`, `metro`). Not present in the shipped app bundle; no user- or patient-controlled input reaches this code path. | Waiting on upstream `braces@3.0.4+`. Re-evaluated on every dependency bump. |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | `node-forge` | `<= 1.4.0` (RSA PKCS#1 v1.5 verification accepts extra nested DigestAlgorithm elements) | Expo CLI dev-server / export code-signing path only (`@expo/code-signing-certificates`). No path from patient telemetry or PHI to this verifier. | Waiting on upstream `node-forge@1.4.1+`. Re-evaluated on every dependency bump. |

Policy: these entries are reviewed on every dependency change and removed from this table the moment upstream ships a patched release. Any *new* advisory — at any severity tier above the CI gate — is treated as a build-breaking event.
