# Phase 1 verification

Implemented 18 October 2026. The client and API are independent npm packages; root commands orchestrate them. Existing content remains local. No deployment or external email was performed.

Validated:

- Client production build succeeds on Node 22.16.0 with Next 16.0.10.
- Production smoke test serves the homepage, its JavaScript assets, project/company images and CV. Same-origin health and invalid-contact requests reach Express. Removed Google/data endpoints return 404.
- All 9 API tests pass, including field/length validation, malformed/oversized JSON, content types, throttling, safe transport errors, CAPTCHA rejection/outages/hostname verification and successful local test SMTP delivery.
- SMTP test delivery preserves the sender/recipient, subject, Reply-To and multipart message. The original HTML template was extracted unchanged, with escaping and newline formatting retained.
- Relocated frontend sources and assets match their originals after normalizing line endings, except the deliberately updated contact form/configuration/dependencies.
- SMTP password and CAPTCHA secret do not appear in browser JavaScript. The pre-existing public contact address remains part of portfolio content.
- Local environment files, nested dependencies and generated builds are ignored. Client environment contains only public values. API credentials were moved locally without printing them or writing them to examples.
- Root lint succeeds with 8 existing presentation-code warnings, explicitly scoped in the new ESLint flat configuration. The contact form retains the standard lint error rules.
- New API dependencies have zero npm audit findings. Client dependency versions are unchanged by relocation; its install reports 36 existing advisories (3 low, 5 moderate, 26 high, 2 critical). Dependency remediation is separate work.

Limitations:

- Docker is unavailable on this machine, so images and Compose could not be executed. Build contexts, secret exclusions, npm commands and standalone/public/static asset copying were updated.
- Real SMTP delivery and live Google verification require configured credentials and an explicitly requested manual submission. Automated checks use local SMTP and injected Google responses.
- Rate limiting is process-local; multiple API replicas require a shared store. Configure trusted proxy hops deliberately for the deployed topology.

See the root README for startup, environment, API and Docker instructions.
