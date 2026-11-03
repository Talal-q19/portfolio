# Portfolio

Next.js in `client/`, Express in `server/api/`, and Convex for content, file storage and authentication persistence. Browser requests use the same-origin Next API proxy; Express owns password hashing, email OTP, JWT cookies and admin APIs.

Use Node 24. Install with `npm run install:all`; copy the client/API `.env.example` files into ignored `.env.local` files and configure your development Convex deployment. Start with `npm run dev:api` and `npm run dev`. Run `npm test`, `npm run lint` and `npm run build` before release.

Production targets are Vercel `be-prod` from `BE-PROD` and `fe-prod` from `FE-PROD`. Convex production is `rugged-reindeer-131`; `acrobatic-rooster-902` is development. See [deployment, migration and recovery](docs/deployment.md) and [admin authentication](docs/admin-auth.md).

The original Strapi database is on another computer. The committed baseline reconstructs 48 content entries and 51 assets. Administrator accounts are intentionally empty; provision them with `npm run admin:create` after configuring a private username, email and initial password. SMTP must be configured before contact/OTP email can work. Automated tests use mock email only.

`server/cms/`, its source assets, phase documentation and the original SQL migration are retained for migration/history. They are not required by the active runtime or deployed to Vercel.
