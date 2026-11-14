# Fields used by the portfolio

The active contract is `server/content-contract/index.js`. Its browser copy is
generated with `node client/scripts/sync-admin-contract.cjs`.

The public renderer, portfolio data mapping, navigation, and SEO were checked
against every editable template. The following fields have no public consumer
and are removed from active metadata and editors:

| Template | Removed fields |
| --- | --- |
| Hero | `greeting`, `availability` |
| Skill groups | `accent` |
| Site settings | `devUsername` |
| Section settings: about/hero | `heading`, `eyebrow`, `introduction`, `order` |
| Section settings: contact | `order` |

Hero text belongs in Hero & CV. The public layout always places the hero first
and contact last. Other sections retain their headings, introductions, visibility,
and order controls. Site navigation has its own editable link labels.

Gallery captions, image kinds, education credentials, contact details, navigation,
footer text, SEO, dates and date overrides all have active consumers. Project
slugs remain necessary for backend uniqueness and content lookup. The hidden
Site Settings CV remains a fallback for entries that have not saved a Hero CV.

Existing snapshots remain readable. Known retired values are omitted from API
responses and removed when a draft is saved; publishing still requires an
explicit operation. During rollout, the frontend supplies the unused required
section defaults to a version-one API so saves remain compatible. A version-two
API omits them. Unknown fields continue to fail validation. Legacy migration
snapshots and Strapi export schemas remain historical sources, so import identity
and reconciliation are preserved.
