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
- **Dependency Auditing:** Automated `npm audit` and vulnerability scanning are enforced via CI workflows.
