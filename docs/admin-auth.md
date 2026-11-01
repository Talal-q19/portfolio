# Portfolio Studio authentication

The Express API now authenticates every real dashboard request. The former local editing bypass no longer grants access. Development fixture preview remains isolated from the API. Strapi's internal editor credential stays server-side and is separate from the browser's JWTs.

## Local configuration

Set these in the ignored `server/api/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:URL_ENCODED_PASSWORD@127.0.0.1:5432/portfolio
REDIS_URL=redis://127.0.0.1:6379
AUTH_JWT_SECRET=GENERATE_AT_LEAST_32_RANDOM_BYTES
ADMIN_ORIGIN=http://localhost:3000
CMS_ADMIN_TOKEN=YOUR_INTERNAL_PORTFOLIO_EDITOR_CREDENTIAL
ADMIN_USERNAME=your-admin-name
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your-initial-password-at-least-8-characters
```

This workstation's existing database is actually named **`potfolio`**; its ignored API environment uses that name. Other installations should use their actual database name. Passwords containing `@`, `:`, `/`, etc. must be URL-encoded in the connection string. The database must already exist. Existing SMTP configuration is reused for OTP delivery. Never expose these values with a `NEXT_PUBLIC_` prefix.

`CMS_ADMIN_TOKEN` may fall back to the existing `CMS_LOCAL_ADMIN_TOKEN` while developing. That credential is issued by the CMS setup and can expire independently of browser sessions. Renew it using the existing CMS provisioning process when required. `LOCAL_ADMIN_ENABLED` no longer enables unauthenticated requests.

Run from the repository root:

```powershell
npm run db:migrate
npm run admin:create
```

Remove `ADMIN_PASSWORD` from `.env` after provisioning. Admin creation refuses duplicates and never overwrites an existing account or password. There is no public registration endpoint. Start the API, CMS and client with the project's normal commands, then visit `/admin`. The API checks PostgreSQL, the migrated table and Redis before listening. If configuration or dependencies are missing, it fails closed.

Migrations use **node-pg-migrate**, with ordered files in `server/api/migrations` and a `portfolio_auth_migrations` history table. The runner applies pending changes in a transaction with an advisory lock; rerunning `npm run db:migrate` is safe. The initial migration adds only `portfolio_admins`, with UUID ID, unique normalized username/email, salted scrypt password hash, `blocked` boolean, token version and timestamps. Plaintext passwords are never stored in PostgreSQL. Versioned migrations provide the requested Liquibase-style workflow without introducing a Java runtime.

## Login, reset and sessions

- Login verifies username and password, then emails a cryptographically random six-digit OTP. No session exists until verification succeeds.
- Redis stores a keyed OTP hash and challenge metadata for **300 seconds**, with a maximum of five guesses. Lua makes attempt counting and consumption atomic. Login and password reset codes have different purposes and cannot be interchanged. Codes and grants are single use.
- Password reset starts with the admin email. Unknown accounts receive a generic response without email. Blocked accounts receive a backend block message. Successful OTP verification grants a separate one-use reset token for five minutes. The new password requires at least 8 characters and at most 256 UTF-8 bytes. Reset increments `token_version`, invalidating all previous sessions and outstanding challenges.
- HS256 JWTs have explicit issuer, audience, type, expiry and random ID. Access tokens last **10 minutes**; refresh tokens last **7 days** and rotate on refresh. Redis stores a hash of the current refresh token. Reusing an old refresh token revokes that session. Logout deletes the Redis session. Every authenticated request also checks the PostgreSQL block flag and token version.
- Both tokens use HttpOnly, SameSite=Strict cookies scoped to `/api/admin`; production also requires Secure cookies and an HTTPS `ADMIN_ORIGIN`. The browser never receives the internal CMS credential or stores JWTs in localStorage. Reset grants stay only in component memory.
- Writes require the `X-Admin-Request` header and validate the browser Origin against `ADMIN_ORIGIN`; the API enables no CORS access. Configure exactly the browser origin you use, including its port. Serve browser and API through the existing same-origin Next rewrites.
- Auth endpoints share a Redis-backed IP limit of 40 requests per 15 minutes. Code-send requests additionally have account limits of five per 15 minutes. Failed passwords are counted per normalized username: the fifth failure blocks the account for **one full day**. Failed OTPs are counted per admin across login/reset challenges: the fifth failure blocks the account for **five full minutes**. Redis atomically counts failures and starts the lock TTL on the fifth failure; retries never extend it. Successful password or OTP verification clears its respective counter. Before reaching five failures, the failure-count window is one day for passwords and five minutes for OTPs.
- Failure responses include `attempts: { kind, failed, limit, blocked, retryAfterSeconds }`. The form displays counters such as **Password failed attempts: 1/5** and **OTP failed attempts: 5/5**, alongside the exact backend message. Temporary blocks return 429 with the actual remaining duration in Retry-After. These locks apply to login, recovery, pending OTP verification, access and refresh; requesting a new OTP cannot bypass them. They expire automatically and do not change the permanent database `blocked` flag. Permanently blocked accounts receive a clear 403 message.
- The client retries a management request once after a shared refresh. If sign-in is required, existing editor state stays mounted so the open form survives reauthentication.

## Blocking an account

Set `ADMIN_USERNAME` to the target username in the server environment, then run:

```powershell
npm run admin:block
npm run admin:unblock
```

Both commands increment the token version so old sessions do not become valid again after unblocking. Blocking denies login, OTP verification, reset, refresh and management requests. This is an operator command; there is no unauthenticated account-management endpoint.

## Verification

```powershell
npm test --prefix server/api
npm test --prefix client
npm run lint --prefix client
$env:AUTH_INTEGRATION='true'
node --test server/api/tests/auth-integration.test.js
Remove-Item Env:AUTH_INTEGRATION
```

The integration test uses the configured local database/Redis, inserts a uniquely named temporary admin and isolated Redis keys, and removes only those resources. It tests the actual SQL repository, Redis OTP TTL and Lua operations, simultaneous OTP consumption, refresh replay, password reset, rate limiting and blocking. Unit tests cover purpose separation, expired/tampered JWTs, attempts, cookie flags, CSRF and fail-closed authorization. SMTP uses the existing sender; automated tests do not email real recipients.

Redis 5 is supported through RESP2 and TTL-preserving Lua. For production, use maintained PostgreSQL/Redis services with private network access and service credentials. Configure `TRUST_PROXY_HOPS` only for the actual trusted proxy topology, so forwarded IP headers cannot evade rate limits. Container deployments must use reachable database/Redis hostnames rather than host-loopback addresses. The Docker API image includes migration and operator scripts; run migrations before starting the updated API.

References: [node-pg-migrate runner](https://salsita.github.io/node-pg-migrate/api), [JWT verification options](https://github.com/auth0/node-jsonwebtoken), [Redis key expiration](https://redis.io/docs/latest/commands/expire/).

## Workstation verification — 1 November 2026

Applied the migration to the existing `potfolio` database and confirmed a second run makes no changes. Created the requested `talal` account; only its password hash is stored. Renewed the existing internal CMS editor credential with explicit approval and verified category access. Verified the existing SMTP connection without sending an email. All 26 API tests (including live PostgreSQL/Redis integration), 29 client tests, API syntax checks, client lint and the final production build pass. Restarted the local API/client and checked `/admin` returns 200, unauthenticated session/content requests return 401, and writes without the admin request header return 403. A real recipient's interactive OTP login/reset has not been exercised; automated delivery checks use a test transport.

The follow-up attempt-counter change passes 30 API tests and 30 client tests. Tests cover counters 1–5, full-day password locks, five-minute OTP locks across challenges, success resets, automatic expiry, backend block messages and Retry-After. The live Redis test also checks concurrent failures cannot exceed five or bypass a block, using isolated test resources.
