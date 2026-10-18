# Portfolio

The existing Next.js portfolio lives in `client/`. The independent Express contact API lives in `server/api/`. Strapi lives in `server/cms/` with its content contract in `server/content-contract/`. The website continues rendering local content until phase 3.

Use Node.js 22+ and npm. Install all packages with `npm run install:all`. Copy the client and API `.env.example` files to `.env` and configure SMTP credentials in `server/api/.env` only. Run `npm run setup:cms` once to generate separate private CMS development secrets. Existing local configuration has been split into these locations without committing secrets.

Run `npm run dev:api` and `npm run dev` in separate terminals. The client runs on port 3000 and forwards `/api/contact` and `/api/health` to the API on port 4000. `API_INTERNAL_URL` selects the API destination; configure it before building the client. Future Next cache callback routes are excluded from this explicit proxy list. Browser requests use the same origin, so no permissive CORS configuration is needed.

Run `npm test` for API validation, CAPTCHA, rate limit, transport failure and local test SMTP delivery checks. Tests never use real SMTP credentials or send external email. Run `npm run lint` and `npm run build` for client validation, then `npm start` and `npm run start:api` for production. This is JavaScript; do not start the dev server to check types. If TypeScript is introduced, use `npx tsc --noEmit` in the configured package.

The migrated ESLint flat configuration reports existing presentation-code issues as warnings in their specific files (effect state updates, randomized animation ordering, navigation assignment and unescaped quotes). Other files, including the contact form, retain the standard error rules.

`POST /api/contact` accepts JSON `{ "name": "Visitor", "email": "visitor@example.com", "message": "Hello", "captchaToken": "optional-when-disabled" }`. Name and email are limited to 100 characters, message to 500. Responses include `success` and `message`, with field errors for HTTP 422. Malformed JSON returns 400, oversized bodies 413, unsupported content type 415, rate limits 429, CAPTCHA outages 503 and mail delivery failures a generic 500. `GET /api/health` is a liveness check; it does not send mail or probe SMTP.

To enable reCAPTCHA v2 checkbox verification, set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in the client before building and `RECAPTCHA_ENABLED=true` plus `RECAPTCHA_SECRET_KEY` in the API. Set `RECAPTCHA_EXPECTED_HOSTNAME` to restrict the expected domain. If the API flag is omitted, a configured secret enables verification automatically. Never use a `NEXT_PUBLIC_` secret. CAPTCHA failure blocks delivery. Tokens reset after each submission attempt.

Docker: `docker compose --profile dev up --build` or `docker compose --env-file client/.env --profile prod up --build`. Both include the API. Production copies Next standalone output, static assets and `public/`. Build the applications independently with `client/Dockerfile.prod` (context `client/`) and `server/api/Dockerfile` (context `server/`, which includes the shared contract). Public client environment variables and the proxy destination are build arguments. Secret environment files are excluded from image contexts. Set production HTTPS at your ingress and keep the API behind the client/ingress. Set `TRUST_PROXY_HOPS` only for a fixed, trusted proxy topology; direct requests otherwise use socket IPs. The contact limiter is per process; a multi-replica deployment needs a shared limiter store.

Real SMTP delivery is reserved for an explicitly requested manual contact submission. No production deployment or external message is part of automated checks.

For phase 2, run `npm run dev:cms` and open `http://localhost:1337/admin`. Create your first built-in Strapi administrator there. This is separate from the future portfolio dashboard login. `npm run migrate:portfolio` backs up the local database/media and imports 48 complete private drafts with 51 source media files. See [CMS setup and validation](docs/phase-2-cms.md) for import, publishing, production storage, permissions and verification details.

Phase 3 replaces public local data imports with the shared Express category API. See [phase-3-api.md](docs/phase-3-api.md) for the least-privilege read credential, publication/setup steps, API examples, freshness behavior and verification; [openapi.json](docs/openapi.json) is the checked-in API specification. Custom-admin routes remain closed until phase-5 login is implemented.

Portfolio request flow: Browser `GET /api/content` ? same-origin proxy ? Node.js/Express in `server/api` ? Strapi in `server/cms`. Content requests appear under browser Network ? Fetch/XHR. The initial page shows a loading state until the API responds; the Next.js server does not fetch portfolio content.
