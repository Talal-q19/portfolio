# Vercel and Convex deployment

The public site and Portfolio Studio are Next.js in `client/`. Express in `server/api/` owns authentication, email, public content APIs and admin APIs. Convex owns persistent content, uploaded files, accounts and ephemeral authentication state. Strapi and the SQL migration are retained as legacy export/history sources; they are not deployed.

| Service | Vercel project | Production branch | Root |
| --- | --- | --- | --- |
| Frontend | fe-prod | FE-PROD | client |
| Express | be-prod | BE-PROD | server/api |

Both use Node 24. Enable files outside the backend root so npm can resolve `../content-contract`. Only the backend build runs `convex deploy`; the frontend never receives a Convex deploy key. Use separate Convex deploy keys, HTTP URLs and service secrets for development/preview; never point a preview build at production. The backend build refuses to run without its environment's deploy key.

Production branch tracking is explicitly configured on each Vercel project: `be-prod` tracks `BE-PROD`, and `fe-prod` tracks `FE-PROD`. Their `vercel.json` Git allowlists reject other branches. Preview deployments are disabled for these production-only projects. The former `talal-qasim-portfolio` project is disconnected from Git, and the repository-root configuration disables its legacy Git builds. Its existing hosted deployment and domain remain intact. New commits should receive only the corresponding service's production check; older commits retain their historical checks.

## Environment

Private local configuration lives in `server/api/.env.local` and `client/.env.local`; both are ignored. Vercel production variables must be configured separately.

- Backend: `CONVEX_HTTP_URL`, `CONVEX_SERVICE_SECRET`, `AUTH_JWT_SECRET`, `API_PROXY_SECRET`, `ADMIN_ORIGIN`.
- Backend build only: `CONVEX_DEPLOY_KEY` for that environment.
- Frontend: `API_INTERNAL_URL`, `API_PROXY_SECRET`, `CONVEX_CLOUD_URL`, `NEXT_PUBLIC_SITE_URL`.
- Convex: `CONVEX_SERVICE_SECRET` matching the backend. Leave `CONVEX_MIGRATION_ENABLED=false` outside an import window.
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO_EMAIL`. Public content works without SMTP; contact and OTP delivery return 503 until configured. No test sends real email.
- Optional CAPTCHA: backend `RECAPTCHA_ENABLED`, `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_EXPECTED_HOSTNAME`; frontend `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.

Production Convex is `rugged-reindeer-131.eu-west-1.convex.cloud`, with HTTP actions at `rugged-reindeer-131.eu-west-1.convex.site`. The originally supplied `acrobatic-rooster-902` deployment is development. Convex account email need not match the Vercel/ChatGPT account.

The same-origin Next API route forwards cookies and origin, preserves both Set-Cookie headers, disables caching and signs the frontend edge's client IP. Express verifies that signature before rate limiting or authentication. Configure the same random `API_PROXY_SECRET` on both projects. Direct unsigned API calls are rejected except liveness. Raw uploads bypass Vercel through generated Convex URLs; ticket issuance and completion require an admin session. Completion checks file size, MIME, signature bytes and extension. Old unattached blobs expire through scheduled cleanup.

## Local checks and releases

Install with `npm run install:all`; use Node 24. Run `npm test`, `npm run lint`, and `npm run build`. `npm run dev:api` and `npm run dev` run the applications; configure a development Convex deployment first using `npm run convex:dev`. Unit/Convex tests use local mocks, with ephemeral local HTTP and SMTP servers for API tests.

For releases, deploy compatible Convex schema/functions and Express from BE-PROD first, verify the backend, then deploy FE-PROD. Both projects remain independent. Future schema changes must preserve compatibility with the previous Express release until traffic has moved. Retain previous deployment IDs and commits. Vercel rollback does not roll back Convex data: use a compatible backend release or a separately verified snapshot restore. Do not delete the old databases during launch.

## Content baseline and migration

Hero owns location and the current designation shown on the portrait card's reverse. About headings and introductions are edited in Section Settings; Site Settings contains shared profile, contact, navigation and SEO fields. Existing Hero entries resolve missing designation from the matching draft or published current experience, then the legacy Site Settings designation. Legacy settings values remain stored for compatibility, and saving Hero makes its values explicit. An empty designation clears the card text.

The original database/media and SMTP configuration are on another computer. The initial production content is reconstructed from the committed source, not represented as a migration of that computer's current database. Administrator accounts are deliberately empty at the owner's request.

Generate the baseline with `node server/api/scripts/build-seed.js`: 48 entries and 51 assets, with an empty administrators array. Its private snapshot is ignored under `server/api/.backups/committed-baseline/`.

For the actual legacy state, run `npm run migration:export --prefix server/api` on the source machine while Strapi is stopped, after installing its legacy dependencies. Override `LEGACY_CMS_ROOT` and `LEGACY_API_ENV` for another checkout. The exporter backs up SQLite and uploads before initializing an isolated backup copy, and exports SQL admin records separately. For a PostgreSQL CMS, restore the retained pg_dump into an isolated database before exporting; do not initialize the live source as an export shortcut. Keep all exported password hashes private. Do not import users for this launch.

From `server/api`, validate a snapshot with:

```powershell
node scripts/import-convex.js <snapshot.json> --validate-only
```

During a controlled import window, enable `CONVEX_MIGRATION_ENABLED` on the target and run:

```powershell
node scripts/import-convex.js <snapshot.json>
node scripts/import-convex.js <snapshot.json> --verify-only
```

The importer preserves source IDs and drafts/published snapshots, checks every media checksum and reference, and reconciles every record and count. Reruns skip identical data and refuse conflicting edits. A baseline import and an original Strapi export have different IDs: do not merge those datasets automatically. Back up the target and explicitly reconcile that replacement first. Sessions, OTPs and reset grants are never imported. Disable the migration flag immediately after verification.

Launch checks: public content, project images/CV, empty-admin denial, signed proxy, cookies, contact failure behavior and health. Once an admin and SMTP are configured, complete an interactive OTP login/reset and content publish/upload check before treating admin/email setup as complete. Rotate any deploy keys pasted into chat; replace them privately in the backend build environment and ignored local file.
