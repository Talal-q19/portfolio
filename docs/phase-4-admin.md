> Historical implementation notes. The active runtime now uses Convex; see [deployment.md](deployment.md).

# Phase 4: custom admin dashboard

**Superseded authentication instructions:** real dashboard access now requires password + email OTP login. The local bypass described below has been removed. See [admin-auth.md](admin-auth.md) for migrations, PostgreSQL/Redis configuration, account provisioning and session behavior. The rest of this document records the original phase-4 implementation.

Implemented 18 October 2026. The dashboard lives at **http://localhost:3000/admin**, under `client/app/admin/`. It uses the shared phase-3 Express API contract and the real local CMS. At the user's request, all management features work without browser login; authentication and production security remain phase 5. The built-in Strapi administrator remains separate.

## Real local editing

Local editing is already configured in this workspace. `/admin` loads existing CMS entries and supports category/content CRUD, image uploads, gallery ordering, draft saves, publishing, unpublishing and deletion with real persistence.

For another checkout, or to renew the internal credential:

1. Configure and migrate the local CMS as described in phase 2, and configure the API `.env`.
2. Stop the CMS; run `npm run setup:admin` from the repository root.
3. Restart the CMS and API. Run the client and open `/admin` without a preview query string.

Setup backs up the development SQLite database/media before changing configuration. It idempotently provisions a passwordless internal `portfolio-local-editor` content-API identity with the PortfolioAdmin role, grants only the custom portfolio management actions, and writes its seven-day credential to ignored `server/api/.env`. No token is printed, sent to the browser or stored in browser storage. There is no browser login or account/password UI. Existing content is neither reimported nor replaced. A disabled/modified internal account is not silently re-enabled by setup.

The API activates this connection only with `LOCAL_ADMIN_ENABLED=true`, `NODE_ENV=development` (the local default), a loopback CMS URL, and `CMS_LOCAL_ADMIN_TOKEN`. It binds to `127.0.0.1` in this mode and accepts local requests through the local Next proxy. Other environments cannot enable it. A future real session verifier takes precedence over this connection. To turn local editing off, set `LOCAL_ADMIN_ENABLED=false` and restart the API. Phase 5 replaces this bridge with browser authentication and production access controls.

## Open the local preview

With the client running in development, visit **`http://localhost:3000/admin?preview=1`** (adjust the port if needed). This preview uses isolated in-memory fixtures, including categories, a Hero, Experience, a Skill Group and an image. No CMS/API services or credentials are required. Saves, uploads, publication changes and deletions affect only these temporary fixtures; reloading resets them.

The server page permits fixture preview mode only when the client runs with `NODE_ENV=development`. A production client build ignores `preview=1` and uses Express; it can still connect to the development API's local editing mode. A production API rejects local editing mode and awaits phase-5 authentication. No draft portfolio preview or production deployment is included.

## Screens and behavior

- Overview: logical entry counts, published/unpublished counts, category cards, and Edit for occupied singletons.
- Categories: create from registered templates, edit metadata, ordering and visibility, stable slugs and used-template restrictions. Referenced category deletion is disabled and also rejected by the API.
- Content: shared searchable category/publication filters, pagination, display order, draft/published-version badges, editing, confirmed unpublish and confirmed logical deletion. A published entry also has a working draft; saving that draft does not replace the public version.
- Editor: category-driven recursive fields, text-only Hero, Experience company image and Present/end-date rules, Education completion year or date range, Skill Group references, technology suggestions with custom values, repeatable details/highlights/code panels/sections, and gallery image/alt/caption fields with keyboard-operated reordering.
- Media: upload, thumbnail selection/preview, paginated library, deletion confirmation and API reference-check errors. PNG/JPEG/GIF/WebP/PDF uploads are limited to 8 MiB; existing migrated image formats remain selectable. Uploads finish before their references can be saved. Server validation remains authoritative for signatures and reference integrity.

Required fields and conditional rules run through the same browser-safe validator as the API/CMS. Invalid or pending forms disable Save Draft and Save & Publish. API dotted field errors appear alongside controls; failed submissions retain local edits and focus the first invalid control. Uploaded unattached media remains in the library. New entries are saved as drafts before a separate explicit publish operation. If creation succeeds but publication fails, the editor retains the created ID so retrying cannot create another document.

Navigation warns before discarding edits. Reload/closing a dirty page triggers the browser's native warning. Mutations/uploads block navigation while pending. Connection/session-expiry responses preserve the form and provide a retry hook for phase 5. Requests use same-origin cookies, no-store caching, cancellation and a bounded timeout. Phase 5 must connect login/redirect/refresh/CSRF behavior before enabling production editing.

The admin uses a responsive layout, visible focus rings, skip link, semantic tables/fieldsets, required markers, labels, inline error associations, status announcements and reduced-motion support. The public portfolio frame is excluded on admin paths, avoiding public content reads, navigation and animated loading effects there.

## Contract maintenance

`client/utils/admin-contract.cjs` is an exact browser-safe copy of `server/content-contract/index.js`. To update after a schema change:

```powershell
node client/scripts/sync-admin-contract.cjs
npm test --prefix client
```

The parity test fails if the copies drift. This avoids importing server files outside the client's standalone build boundary. No server credentials or server integration modules are bundled. Live form controls also use the metadata supplied by `GET /api/admin/categories`.

## Verification

- Automated checks: all 43 tests pass (15 client, 16 API/contact, 12 CMS). New tests cover contract parity, template defaults, request/session errors, multipart boundaries, gallery serialization/reordering, conditional dates, fixture validation/singletons, publication snapshots, protected category/media deletion, complete real-API media pagination, empty optional typed fields, local-mode configuration, and real local-connection CRUD through Express and a disposable Strapi database.
- `npm run lint --prefix client`: no errors; six pre-existing portfolio warnings remain.
- `npm run build --prefix client`: production build passes with the dynamic `/admin` route. No TypeScript migration was introduced, so no `tsc` project check is required.
- Headless Chrome against an isolated production Next server, with browser admin requests mocked using fixtures: Hero has no media control; occupied singleton selection is disabled; required/date validation blocks saves; 422 fields focus correctly without losing edits; session expiry/retry preserves edits; multipart uploads block submission until complete; gallery ordering/alt text, technology suggestions, display order, Save Draft and Save & Publish persist correctly; category creation and media screens work. A production client ignores the fixture query option.
- Live browser verification against the actual three local services, without request mocks or browser credentials: existing CMS data loads; create category; create a complete project; upload a real PNG; select/reorder gallery images; set alt text, technology and display order; save a draft; verify it is absent publicly; reload and reopen; publish and verify public appearance; unpublish and verify public removal; delete content. Temporary category/media cleanup uses the real API. Every pre-existing content ID remains present, including concurrent user-created content.
- The live check exposed a Strapi constraint absent from fixtures: blank optional enum/date/number values must serialize as `null`, rather than empty strings. The write mapper now handles clearing these fields correctly. Media loading also follows the real API's total/pageSize metadata, including libraries over 100 assets.
- An isolated development-server browser check confirms `/admin?preview=1` loads the actual fixture dashboard and makes no `/api/admin` requests. The temporary server is stopped after the check.
- Desktop (1440px) and mobile (375px) screenshots were inspected. Mobile has no document overflow; keyboard focus and reduced-motion checks pass. Automated axe checks, including contrast, pass on the mobile overview. Other screens received label/keyboard interaction checks; this is not a full accessibility audit.

Both fixture and real local browser workflows were checked. Real browser authentication and session redirects remain phase 5. The local CMS/API/client were restarted to activate this dashboard; existing portfolio content was preserved and test resources were removed. No production deployment was performed.
