# Portfolio backend and admin implementation plan

Prepared: 17 October 2026. Planned start: 18 October 2026 (Asia/Dubai).

Scope: planning only. Implementation follows the five phases below, in the user's requested order.

Revision: use category-based content and shared API routes. Every content entry must belong to a category, which determines its form, required fields, allowed media, and singleton/multiple-entry behavior. Hero is text-only. Incomplete content cannot be submitted, including when saving a draft.

## Architecture and ownership

```text
portfolio/
  client/                    Existing Next.js application
    app/                     Portfolio pages and future /admin pages
    public/
    utils/
    package.json
    next.config.js
    .env.example
  server/
    api/                     Node.js + Express application
      src/
        config/
        routes/
        controllers/
        services/            Email, Strapi integration, authentication
        middleware/          Authorization, validation, errors, rate limits
        validators/
        templates/           Existing contact email template
        app.js
        index.js
      tests/
      package.json
      .env.example
    cms/                     Strapi application, introduced in phase 2
      src/
      config/
      package.json
      .env.example
  docs/
  package.json               Root convenience commands
  docker-compose.yml
  .gitignore
```

- Keep the current JavaScript/JSX client and its visual design. Use JavaScript for Express; a TypeScript migration is outside these phases.
- Next.js, Express, and Strapi run as separate applications. Strapi is not embedded inside Express. Suggested local ports: 3000, 4000, and 1337 respectively.
- Requests flow from the client to Express, then to Strapi. Strapi owns content, users, and its database schema. Express does not query or modify Strapi tables directly.
- Use one Strapi-managed content database per environment. With Strapi Cloud, production uses its included PostgreSQL database. A local development database is separate from production, not another application database.
- Use Strapi Cloud's included media storage if deploying there; otherwise configure persistent media storage such as S3 or Cloudinary. Database records contain media metadata and references, not image binaries.
- Prefer same-origin browser requests routed from /api to Express. The Next.js server uses an internal Express URL for server-side fetching. Configure routing so future Next.js cache callbacks cannot be caught by the Express proxy.
- Express owns contact, portfolio, admin, and authentication business APIs. Next.js may retain a minimal internal handler solely for invalidating its own rendering cache.
- Keep npm and lockfiles consistent. Initially retain independent package boundaries and add root commands that target each application; a workspace conversion is not required for this migration.
- Authentication is delivered in phase 5. Admin handlers introduced earlier deny requests by default; service tests and local UI fixtures enable development without deploying an unauthenticated editor.

## Phase 1: Split client/server and migrate email

Deliverables:

1. Move the existing frontend app, assets, utilities, scripts, frontend configuration, and frontend dependencies into client/. Keep repository metadata, shared documentation, and orchestration at the root. Recreate generated dependencies/build output in their new locations instead of blindly moving the entire root.
2. Create server/api/ with Express, configuration validation, centralized error handling, request-body limits, and GET /api/health.
3. Extract the existing Nodemailer handler into an email service, contact controller, and HTML template. Preserve email formatting, plain-text content, recipient behavior, escaping, and Reply-To.
4. Implement POST /api/contact in Express and update the contact form's API configuration. Remove the Next.js contact handler after the Express replacement works.
5. Move CAPTCHA verification from the separate Next.js Google route into the contact submission flow. If CAPTCHA is enabled, require and validate its token before sending mail. The current form does not send a CAPTCHA token, so update both sides together. Remove the orphaned verification endpoint after checking consumers.
6. Move SMTP and CAPTCHA secrets into server/api/ environment configuration. Rename the CAPTCHA secret to a server-only variable without NEXT_PUBLIC_. Keep only public configuration, such as a CAPTCHA site key, in browser-visible variables. Never copy secret values into example files or source control.
7. Add server-side input/length validation, contact rate limiting, and safe error responses. Confirm the placeholder /api/data route has no consumers before removing it.
8. Update Docker build contexts, production asset copying, root commands, import/config paths, nested .gitignore patterns, and environment examples. Preserve the ability to run and deploy client and API independently.

Completion checks: client production build succeeds; existing pages/assets still work; contact validation and transport failure responses are tested; test SMTP delivery preserves the template and Reply-To; secrets do not appear in browser bundles. Use a test SMTP transport for automated checks, and verify real delivery during an explicitly requested manual contact submission.

## Phase 2: Add Strapi and migrate content

Create server/cms/ with a pinned supported Strapi 5 version, development database configuration, media provider, and built-in Strapi admin access. Keep production credentials and content separate from development.

Use two primary Strapi collection types:

- Category: name, stable unique slug (hero, experience, projects, etc.), registered template key, singleton/multiple-entry rule, display order, and visibility. A category selects an approved field template; its required-field rules are maintained in versioned application schemas, not arbitrary editable validation code.
- Content: required category relation, stable document ID, optional slug where applicable, display order, Draft & Publish state, and one structured payload matching its category's template. Every entry has exactly one category.

Represent the payload with typed Strapi components in a dynamic zone constrained to exactly one component. Custom validation must enforce that the component matches the selected category; the component picker alone does not enforce that relationship. Use a shared schema/metadata contract for Express validation and the custom admin form. Expose only safe form metadata to the client. Do not store unrestricted content blobs that bypass field types or media relations.

Initial categories and proposed required fields:

| Category/template | Entries | Required before saving or publishing | Additional supported fields |
| --- | --- | --- | --- |
| Hero | One logical content entry | Heading and short paragraph, both non-empty text | Greeting, role, availability, button labels/links, structured text for code-style panels; no media fields |
| Experience | Multiple | Job title, company name, company image/logo, description, start date, current-position boolean; end date required when current-position is false | Ordered highlights, location |
| Projects | Multiple | Name, unique slug, description, outcome, role, project status, at least one gallery image with alt text, at least one technology and detail item | Extra images/captions, logo/screenshot mode, source/demo URLs (optional for private projects) |
| Skills | Multiple | Name, icon/media, skill-group reference | Other presentation metadata from the approved template |
| Skill Groups | Multiple | Name, eyebrow/subtitle, description | Approved visual accent; groups such as Backend and DevOps are separate from the content category |
| Education | Multiple | Qualification, institution, credential type, image, and a valid date range or completion year | Location, ordered details |
| Site Settings | One logical content entry | Display name, profile image, public contact email, SEO title/description | Social links, CV, public phone/location, navigation/footer copy |
| Section Settings | One logical content entry | Valid section configuration list with section keys and headings | Introductory text, section visibility and ordering |

The profile image currently shown beside the hero moves to Site Settings so the Hero category remains text-only while preserving the existing website design. Empty optional links are permitted; populated links must be valid. Do not invent exact education dates when the existing source only contains a year.

Use repeatable components for bullet lists and galleries so editors do not type JSON. Keep project status (Live, Completed, In progress) separate from publication status. Draft means complete content that is not yet public; incomplete editing remains local in the form until required fields are filled.

Category/cardinality rules:

- Require a valid category for every content entry and reject unsupported templates, wrong payload shapes, and fields not allowed by the selected template.
- Enforce one logical document for singleton categories, counting the draft/published versions as one entry. Make this invariant concurrency-safe instead of relying only on a frontend check or an unprotected count-before-create query.
- Seed the initial categories. Allow category creation using registered templates and metadata editing through the admin APIs. A wholly new field template or rendering layout requires a code/schema change, not just a new category name.
- Keep a category's template immutable once content exists. Prevent deletion of categories still referenced by content. Reassignment of content must revalidate the full payload and destination cardinality.
- Enforce validation in the CMS write path as well as Express so direct Strapi API or built-in admin edits cannot bypass it. Add Document Service middleware/custom validation around creation, update, and publishing, and verify the chosen Strapi version's actual write paths.

Import existing text, logos, galleries, skill icons, education images, and CV through a repeatable migration keyed by stable identifiers. Include content currently embedded in JSX and company-logo lookup maps. Preserve image ordering and avoid duplicate entries on reruns. Back up before importing into an environment containing real content.

Prepare an invite-only PortfolioAdmin content-API role for phase 5, with public registration disabled and no anonymous write permissions. This account is distinct from the built-in Strapi administrator.

Completion checks: every migrated entry has a valid category and correctly typed payload; content and assets match the current portfolio; required fields/media cannot be bypassed through Express or Strapi; duplicate singleton creation is rejected; drafts are not exposed anonymously. The website can still use its existing local data until phase 3 is ready.

## Phase 3: Portfolio and admin APIs, plus client integration

All application routes below live in Express. Use shared category/content routes instead of separate Hero, Experience, Project, Skills, and Education endpoint families. These are proposed custom endpoints, not claims about Strapi's generated endpoint names.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/content | Published homepage content grouped by category; optional category and slug filters |
| GET, POST | /api/admin/categories | List categories with form requirements; create a category using a registered template |
| PATCH, DELETE | /api/admin/categories/:categoryId | Update category metadata or delete an unused category |
| GET, POST | /api/admin/content | List/filter content or create a validated draft assigned to a category |
| GET, PATCH, DELETE | /api/admin/content/:documentId | Read, update, publish/unpublish, or delete any content entry |
| GET, POST | /api/admin/media | List/upload media |
| DELETE | /api/admin/media/:id | Delete media after reference checks |

Examples of public reads: GET /api/content, GET /api/content?category=hero, GET /api/content?category=experience, and GET /api/content?category=projects&slug=my-project. Keep the same response envelope: a list of categories, each with its content items and pagination metadata. Singleton categories contain at most one item. The homepage requests the initial groups once; larger categories can be paged explicitly without silently omitting entries. Unknown category filters return a clear error; an existing empty category has an empty item list.

POST /api/admin/content accepts a category slug and the category-specific data, for example { category: "hero", data: { heading: "Software Engineer", paragraph: "I build web applications." } }. The backend resolves the category and validates its template before saving. New content defaults to a draft.

PATCH /api/admin/content/:documentId uses an explicit operation: update, publish, or unpublish. Update can change content fields and display order. Publishing revalidates the complete persisted entry and required media before calling Strapi's publish service; changing a JSON status property alone never counts as publishing. Validate the operation-specific request shape and reject unknown operations or arbitrary field changes. No separate per-category or per-entry publish endpoint is needed.

Validation flow:

1. Select a category; load its approved field requirements and appropriate editor controls.
2. Fill the required fields and upload required images. An in-progress or failed upload is not a valid image reference.
3. The UI shows field errors and blocks Save/Publish until the form is complete.
4. Express validates the request, category, trimmed non-empty text, URLs, dates, arrays, and existing allowed media references. Strapi enforces the same rules at persistence/publication boundaries.
5. Invalid submissions return HTTP 422 with field-specific errors, such as data.image: "Company image is required". No content document is created or updated by the failed request. Already-uploaded unattached media remains separately manageable.
6. For partial updates, validate the merged final document so required fields cannot be cleared. With current-position true, end date is empty; otherwise end date is required and cannot precede start date. Complete private drafts may be saved, but incomplete drafts are rejected as requested.

Implementation:

- Create one Strapi integration layer with explicit field/media population, normalized responses, pagination, timeouts, and useful error handling.
- Force published-only reads for the portfolio, including populated relations. Allowlist public fields and query parameters; do not pass arbitrary browser queries through to Strapi. Use a server-only read credential for these reads.
- Admin saves explicitly target validated drafts. Implement publish/unpublish behind the shared content endpoint using authorized Strapi controllers backed by Document Service; do not depend on undocumented Content Manager internals. Forward the verified administrator's content-API identity for writes, rather than using an unrestricted master token.
- Add deny-by-default admin authorization middleware now. Test services with injected test identities; do not introduce an environment flag that opens production admin routes. Real login and live custom-admin editing arrive in phase 5.
- Validate media uploads, restrict response fields, and prevent accidental deletion of in-use assets.
- Replace client local content imports with server-fetched category/content data passed into existing interactive components. Choose renderers from registered template keys, not arbitrary executable content. Preserve the current design and server-rendered content. Remove numeric-ID assumptions; use stable document identifiers for UI state.
- Define content freshness explicitly. Configure authenticated publish/unpublish/delete/media notifications to invalidate Express/Next.js caches that are actually used. Add a bounded timed refresh fallback. Draft responses and authenticated admin responses are never publicly cached.
- Existing open pages refresh on navigation/reload; live push updates are outside this plan. Content edits require no deployment. New section types or layout behavior still require code changes.
- Document API schemas, validation errors, pagination, authentication requirements, and example requests in OpenAPI or a checked-in API collection.

Completion checks: portfolio renders from the shared category API; public draft/field leakage tests pass; pagination/order/media mapping work; changes appear on the next fresh visit after publication; unauthenticated admin access fails; content-service CRUD and publishing tests pass. Test category omission, wrong payload/template, whitespace-only required text, missing/deleted/wrong-type images, invalid dates, clearing required fields, duplicate Hero creation, incomplete draft submission, and direct CMS validation bypass attempts.

## Phase 4: Build the custom admin UI

Build the custom dashboard in client/app/admin/. The built-in Strapi dashboard remains a separate CMS management tool.

Screens: overview with entry counts/status; Categories; a shared Content list/filter; a category-driven Create/Edit Content form; Media Library. Hero, Experience, Projects, Skills, Education, and settings can remain sidebar shortcuts into the same category-filtered flow rather than separate editor implementations.

Main flow: Add Content -> choose category -> display that category's fields -> fill required fields/upload media -> validate -> Save Draft or Publish. Selecting Hero shows text/link controls without an image requirement; selecting Experience shows its required company image, title/name/description, and conditional date controls. Existing singleton categories offer Edit instead of Add Another.

Interactions: draft/published badges, required-field markers, inline validation, disabled submission during invalid fields or pending uploads, date inputs with a Present toggle, repeatable highlights/details, technology selection, gallery upload/preview/reordering, display ordering, Save Draft, Publish, Unpublish, and confirmed deletion. Preserve local edits when server validation fails. Provide clear loading/error/empty states, accessible labels and keyboard controls, and unsaved-change warnings. Production preview, if included, must use an authenticated draft path with no public caching.

Build against the phase-3 API contract with test fixtures/local component previews until phase-5 authentication works. Do not enable a public editable dashboard to demonstrate it. Prepare redirect/session-expiry handling for the next phase.

Completion checks: category selection produces the correct fields; required-field and conditional-date controls block incomplete submission; API validation errors appear beside the appropriate fields; singleton categories cannot be duplicated; gallery/date/order flows work with fixtures; desktop/mobile layouts and keyboard interactions are checked. Live authenticated editing is completed in phase 5.

## Phase 5: JWT admin login and final integration

Use Strapi Users & Permissions as the account/password authority, with a dedicated PortfolioAdmin role. Express mediates login, refresh, logout, and authorization. Accounts and auth-session data use Strapi's existing database, avoiding another database or duplicate password store. Strapi CMS administrator accounts remain separate from custom-dashboard users.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /api/admin/auth/login | Verify credentials and establish the admin session |
| POST | /api/admin/auth/refresh | Renew short-lived access through the refresh session |
| POST | /api/admin/auth/logout | Revoke the refresh session and clear cookies |
| GET | /api/admin/auth/me | Return minimal current-admin/session information |

Implement /admin/login and connect the phase-4 screens to the live APIs. Use the selected Strapi version's refresh/session mode, short-lived JWT access tokens, and managed refresh sessions. Express places browser credentials in Secure, HttpOnly, appropriately scoped SameSite cookies; avoid localStorage token persistence. Adapt upstream cookie handling deliberately rather than forwarding mismatched CMS-domain cookies.

On privileged requests, validate the token through the supported Strapi authentication mechanism and verify the current account state and PortfolioAdmin permissions. Enforce authorization in Express and Strapi. Add CSRF/origin checks, login throttling, generic invalid-credential responses, and server-side validation. Provision the first account through a controlled setup path with public signup disabled. Document password reset and account-disable procedures.

Logout must revoke the refresh session and clear browser cookies. Verify the selected version's access-token revocation behavior; already-issued tokens may remain valid until expiry unless additional session checking is implemented. Test account disabling, role removal, expiry, refresh, and logout instead of assuming that deleting a browser token revokes it.

Completion checks: successful/failed login, expired/tampered tokens, non-admin roles, blocked accounts, CSRF rejection, logout, refresh, and direct API access are tested. The complete real flow works: log in, create project, upload/reorder images, save draft, verify draft is private, publish, verify public appearance, unpublish, verify removal.

Finish deployment configuration for the three applications, HTTPS/proxy routing, environment separation, service health checks, and database/media backups. Run a production smoke test and document rollback. Do not deploy a production editing surface before this phase is complete.

## Validation and tomorrow's starting point

The repository is currently JavaScript/JSX. Use targeted API tests, JavaScript syntax/lint checks, and production builds when appropriate. Fix the currently outdated lint command as part of phase 1. Do not run a development server just to find type errors. If TypeScript is introduced later, use npx tsc --noEmit in that configured package.

Start on 18 October with phase 1 only: inspect the working tree, create an isolated codex/ branch if needed, establish the current build baseline, move the frontend, scaffold Express, migrate email/CAPTCHA, update routing/configuration, and verify the result. Keep existing content local until phases 2 and 3 are complete. Each phase ends with its completion checks and a reviewable change set.

References checked while preparing this plan:

- [Strapi Cloud database configuration](https://docs.strapi.io/cloud/advanced/database): included PostgreSQL database and external-database behavior.
- [Strapi Users & Permissions](https://docs.strapi.io/cms/features/users-permissions): content-API users, roles, disabled signups, JWT and refresh sessions, distinct from CMS administrators.
- [Strapi Document Service](https://docs.strapi.io/cms/api/document-service): document lifecycle and publishing operations for custom CMS controllers.
- [Strapi Document Service middleware](https://docs.strapi.io/cms/api/document-service/middlewares): extension points for enforcing category validation around content writes.
- [Strapi models](https://docs.strapi.io/cms/backend-customization/models): typed components, relations, and dynamic-zone schema definitions.
- [Express production security guidance](https://expressjs.com/en/advanced/best-practice-security/): TLS, input handling, cookie security, and authentication protection.
