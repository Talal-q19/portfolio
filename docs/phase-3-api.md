> Historical implementation notes. The active runtime now uses Convex; see [deployment.md](deployment.md).

# Phase 3: portfolio and admin APIs

Implemented 18 October 2026. Express serves the browser APIs in [openapi.json](openapi.json); Strapi owns persistence and repeats validation through the phase-2 Document Service guard. The custom admin UI and browser login remain phases 4 and 5. Production Express admin routes deny all requests until a trusted session verifier is wired in phase 5. There is no environment variable or browser header that enables editing.

Phase-4 update: the working local dashboard now uses an explicit development-only server credential connection, provisioned with `npm run setup:admin`. This enables local editing without browser login while leaving production access closed. See [phase-4-admin.md](phase-4-admin.md); the deny-by-default description below records the phase-3 baseline.

## Local setup

Keep the three application environments separate. `server/api/.env` needs `CMS_INTERNAL_URL=http://127.0.0.1:1337` and a server-only `CMS_READ_TOKEN`. For development, stop the CMS and run:

```powershell
npm run setup:portfolio --prefix server/cms
```

On first local activation, `--publish-migrated` backs up the development database/media and publishes only the existing migrated portfolio documents, preserving their current fields and media. Omit the flag to leave those entries private. Stop the CMS before running it, then restart the CMS and API.

This creates a custom token with **only** `api::portfolio.portfolio.read`, saves its value directly to the ignored API `.env`, and never prints it. It preserves an existing credential during portfolio activation, refuses implicit token rotation, and cannot run in production. For production, create the same custom-scoped token in Strapi Settings > API Tokens and store it through your deployment secret manager. Never use a full-access token. Restart Express after configuring it.

Next rewrites are captured at build time: set the same `API_INTERNAL_URL` when building and running the client. The production smoke command requires a loopback build target (default port 4000) and that port must be free.

Start CMS, API and client in separate terminals using the existing `dev:cms`, `dev:api`, and `dev` commands. The public page now needs the API and CMS; missing credentials or an unavailable CMS produces an availability error, rather than silently showing old local content. The local phase-2 import remains private until published. Publish complete entries using the built-in CMS administrator; publish Skill Groups before Skills. To publish the original migration baseline deliberately, the existing migration supports `npm run migrate:portfolio -- --publish`; that command backs up first and **reimports the baseline**, so do not use it to publish subsequently edited content.

Set `CMS_MEDIA_PUBLIC_URL` in the CMS and client to the browser-accessible media origin (default `http://localhost:1337`). This must differ from a container-internal CMS host when necessary. Next Image allows `/uploads/**` on that configured origin; loopback CMS origins use direct image URLs because Next blocks optimizer fetches to private addresses. For public CMS origins, image optimization remains enabled; Cloudinary's existing allowed host remains supported. CMS and API credentials never enter client component props or browser environment variables.

## Public reads

```http
GET /api/content
GET /api/content?category=hero
GET /api/content?category=projects&slug=my-project
GET /api/content?category=projects&page=2&pageSize=10
```

Every response uses the same envelope:

```json
{
  "categories": [{
    "documentId": "stable-category-document-id",
    "name": "Hero", "slug": "hero", "templateKey": "hero",
    "cardinality": "singleton", "displayOrder": 0, "visible": true,
    "items": [{
      "documentId": "stable-content-document-id", "category": "hero",
      "displayOrder": 0, "slug": null, "publishedAt": "2026-10-18T00:00:00.000Z",
      "data": { "heading": "Software Engineer", "paragraph": "I build web applications." }
    }],
    "pagination": { "page": 1, "pageSize": 1, "total": 1, "pageCount": 1 }
  }]
}
```

Unpaged reads explicitly fetch all entries, including groups larger than a Strapi REST page. Explicit pagination requires `category`; page starts at 1, pageSize defaults to 25 and is limited to 100. Each group includes total/pageCount and stable displayOrder/documentId ordering. Unknown categories return 422; visible categories with no published entries return `items: []`. Hidden categories are omitted. Only category, slug, page and pageSize are accepted publicly; draft/status/populate/filter injection is rejected.

The CMS read handler forces published status, projects template fields explicitly, and resolves skill-group relations against published, visible groups. Public results never include raw dynamic zones, component IDs, migration identifiers, administrator fields, upload provider credentials or arbitrary nested CMS objects. Media becomes `{id,name,alternativeText,mime,width,height,size,url}` with absolute URLs. Skill-group references become stable document IDs. Admin reads add `status=draft|published`, defaulting to draft, and are never publicly cached.

## Admin contract

Categories: `GET/POST /api/admin/categories`, `PATCH/DELETE /api/admin/categories/:categoryId`. GET returns `{categories, requirements}`; requirements contains the shared versioned templates and repeatable-component field metadata. Writes return `{category}`. POST requires name, slug, templateKey and matching cardinality; displayOrder defaults to 0, visible to true. PATCH accepts only those metadata fields. Slugs remain stable; used templates/cardinality cannot change; referenced categories cannot be deleted.

Content: `GET/POST /api/admin/content`, `GET/PATCH/DELETE /api/admin/content/:documentId`. List responses use the public envelope with private drafts; individual reads and writes return `{item}`. Create defaults to draft and returns 201:

```json
{"category":"hero","data":{"heading":"Software Engineer","paragraph":"I build web applications."}}
```

PATCH requires an explicit operation:

```json
{"operation":"update","data":{"heading":"Backend Engineer"},"displayOrder":1}
```

```json
{"operation":"publish"}
```

```json
{"operation":"unpublish"}
```

Only update accepts category/data/displayOrder. It validates the merged final document, including category reassignment, so required fields cannot be cleared. Arrays replace their complete field value. Publish revalidates persisted content and media through Document Service before actually publishing. Private complete drafts are allowed; incomplete drafts are rejected. A failed content write does not persist a partial entry. Delete removes the logical document and both publication versions; referenced Skill Groups are protected.

Media: `GET/POST /api/admin/media`, `DELETE /api/admin/media/:id`. Lists return `{items,pagination}`; page/pageSize apply. POST uses multipart/form-data with exactly one `files` field, no metadata fields, and a maximum actual file size of 8 MiB (9 MiB transport limit accommodates multipart framing). PNG, JPEG, GIF, WebP and PDF are accepted after matching signature, MIME and extension validation. Image decoding also runs through Strapi upload processing. Active formats such as SVG/HTML and replacement uploads are excluded; existing migrated SVG icons remain readable. Upload returns 201 with `{items}`. Deletion checks both drafts and published entries under the shared mutation lock. Successful delete returns `{success:true}`. Unattached uploaded media can be removed separately.

Express verifies the admin identity before parsing privileged request bodies. It forwards only the verified account's content-API bearer token to the CMS. CMS routes require both Users & Permissions action authorization and an active, confirmed PortfolioAdmin account. API tokens cannot satisfy that account policy. No master token is used for writes. Test identities are injected in isolated tests, never enabled through configuration. Phase-5 work must implement the trusted verifier, cookies and CSRF protection before exposing live custom-admin editing.

## Errors and freshness

Invalid fields return 422, for example:

```json
{"success":false,"message":"Content is incomplete or invalid.","fields":{"data.image":"An existing image is required."}}
```

Client forms can map dotted paths directly to controls. Invalid JSON is 400, unverified custom-admin requests are 401, oversized bodies are 413, and malformed media transport is 415. Missing documents return 404. CMS failures become safe 502/503 responses without upstream credentials or stack traces; transport requests have a 10-second configurable timeout.

**Request flow and freshness:** The browser fetches `/api/content` after the page loads. Next proxies the request to the Node.js/Express application in `server/api`, which calls Strapi with its server-only read credential. No content request runs in the Next layout, metadata, or page server rendering. A shared client provider makes one completed request for the page, navigation, and footer (development Strict Mode may also show an aborted request). Loading, timeout, error, retry, and unmount cancellation are handled in the client. The browser fetch uses `cache: 'no-store'`, and all content/admin API responses send `Cache-Control: no-store`. Express has no content cache. The timed refresh fallback is therefore every new request (zero persistent cache TTL). There are no persistent Express/Next content caches to invalidate, so webhook authentication, revalidation callbacks and cache notification secrets are intentionally unnecessary in this phase. CMS publish/unpublish/delete/media changes appear on the next browser content request without a deployment. Already open pages refresh on reload/navigation; live push is outside scope. Any future introduction of persistent caches must add authenticated notifications and a bounded TTL together.

## Verification

- `npm test`: contact/API unit tests and SQLite-backed CMS integration tests, including direct CMS bypass attempts, draft privacy, category CRUD, singleton duplication, explicit publish/unpublish/delete, media upload/deletion, pagination/order and field projection.
- `npm run lint`: client ESLint plus API/CMS syntax checks.
- `npm run build`: production Next build; no development server is used for type checks.
- After building, `npm run smoke:portfolio --prefix server/cms` starts a disposable CMS database, imports/publishes baseline content, starts Express and the production Next server, checks the loading shell performs no server content reads, exercises the same browser fetch helper through the proxy routes, and verifies private edits stay hidden and publication changes show on fresh requests, then removes its test resources. It does not modify the local content database or credentials.
- `npm run docs:api --prefix server/cms` regenerates the OpenAPI artifact from shared field metadata.

The importer now uses an immutable checked-in migration snapshot rather than extracting text/constants from live JSX. This preserves repeatability after renderer changes; local source modules remain available solely as legacy migration references and are no longer imported by active portfolio renderers.

Implementation checked against [Strapi Document Service](https://docs.strapi.io/cms/api/document-service) and [custom routes](https://docs.strapi.io/cms/backend-customization/routes), plus the pinned installed Strapi source and real HTTP tests. Document Service returns unsanitized data; the custom public projection is deliberate.

Final verification on 18 October 2026: 13 API/contact tests plus 11 CMS tests pass (24 total); root lint passes with six existing client warnings and no errors; the production client build passes. The three-service production smoke passes with 48 migrated entries, including server HTML, same-origin proxy requests and draft/publication freshness. All disposable services/databases are removed by the smoke command. The existing local development drafts and credentials were not modified. No production deployment was performed.

Local activation correction: the read credential is now configured and the 48 existing migrated development documents were published after a database/media backup. No reimport replaced their data. The running local CMS/API were restarted and the website was verified over HTTP.

Local CMS media is now mapped to same-origin `/cms-media/...` URLs in portfolio component props and metadata. Next proxies only that upload path to `CMS_INTERNAL_URL` (default `http://127.0.0.1:1337`). This removes the browser dependency on a separate localhost CMS port and works when the website is opened through another local address. External media-provider URLs remain unchanged. Set the client-side server environment `CMS_INTERNAL_URL` at build time when using container hostnames. Content fetching runs in the browser: inspect Fetch/XHR for `GET /api/content` after reload, and Img/All for `/cms-media/...` image requests.

The user-requested browser-fetch architecture supersedes the original plan's server-rendered content requirement. The initial HTML contains a loading shell and generic metadata; published sections and CMS SEO tags appear after JavaScript fetches the API. Crawlers and link previews that do not run JavaScript will see the initial metadata. The CMS read token and all privileged logic remain in `server/`.

Browser-fetch verification on 18 October 2026: all 29 tests pass (5 client, 13 API/contact, 11 CMS). The CMS suite exercises the browser fetch helper against a real Express listener and Strapi database. Client lint passes with the six existing warnings, and the production build prerenders the loading shell without fetching CMS content. No manually managed local services were started or stopped for this change.
