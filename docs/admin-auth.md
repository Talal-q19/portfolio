# Portfolio Studio authentication

Express authenticates real dashboard requests. Convex stores administrator records, challenge proofs, reset grants, session hashes and counters. Password hashing (salted scrypt), JWT signing and SMTP stay in Express. There is no public registration endpoint and no local authentication bypass.

Configure the ignored `server/api/.env.local` using its example. The owning Convex account can use a different email. `CONVEX_SERVICE_SECRET` must match the deployment; `AUTH_JWT_SECRET` and the frontend/backend `API_PROXY_SECRET` must be at least 32 random bytes. `ADMIN_ORIGIN` must be the exact HTTPS frontend origin in production. To allow multiple frontends, set the comma-separated `ADMIN_ORIGINS` allowlist instead; it overrides `ADMIN_ORIGIN`. Production permits HTTP only for explicitly listed loopback hosts, such as `http://localhost:3000`.

## Provision an administrator

The production administrators table is deliberately empty. Set `ADMIN_USERNAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` privately, then run `npm run admin:create` from the repository root. The password requires at least eight characters and at most 256 UTF-8 bytes. The command hashes it before sending the record to Convex and refuses duplicate accounts. Remove `ADMIN_PASSWORD` afterward. Do not insert plaintext passwords through the Convex dashboard.

Set `ADMIN_USERNAME` and run `npm run admin:block` or `npm run admin:unblock` to change account access. Both increment the token version, invalidating old sessions. The retained SQL migration under `server/api/migrations/` documents the original schema; Convex now applies its version-controlled schema through the backend deployment, with no PostgreSQL migration runner.

## Login and recovery

Password verification sends a six-digit email OTP, valid for five minutes. OTP proofs are keyed hashes and purpose-separated between login and reset. Convex mutations perform proof comparison, failure counting and single-use consumption atomically. Five wrong passwords lock for a full day from the fifth failure; five wrong OTPs lock for five minutes across challenges. Retries do not extend lock durations.

Successful OTP verification issues ten-minute access and seven-day refresh JWTs. Refresh proof comparison, replacement and replay revocation execute atomically. HttpOnly, SameSite=Strict cookies are scoped to `/api/admin`, with Secure in production. Cookies pass through the frontend proxy; browser JavaScript never receives signing or service secrets. Every authenticated request checks the account, token version and session.

Reset requires a purpose-specific OTP and a separate one-use five-minute reset grant. Reset changes the password hash and token version. Logout revokes the session. State expiration is checked on every read even if scheduled cleanup has not run. Missing Convex configuration or service outages deny authentication. Missing SMTP returns 503 for delivery while public content remains available.

See [deployment.md](deployment.md) for environment configuration, direct uploads, migration/reconciliation, checks and rollback limitations. No real recipient receives email during automated checks; an interactive OTP login/reset is required after configuring SMTP and creating an account.
