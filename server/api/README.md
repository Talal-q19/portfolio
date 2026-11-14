# Backend architecture

The API follows an MVC/service/repository structure in JavaScript. Service
contracts act like Java interfaces; each has an implementation in `service/impl`.
Constructor injection in `src/config/application-context.js` replaces a dependency
injection container.

```text
server/api/
├── src/
│   ├── controllers/           HTTP routes, status codes and cookies
│   ├── service/               Service contracts
│   │   └── impl/              Business rules and use cases
│   ├── repository/            Convex bridge, database and storage access
│   ├── entity/                Persisted entities, validators and indexes
│   ├── dtos/
│   │   ├── request/           Input shapes and request validation
│   │   └── response/          Response projection; excludes internal fields
│   ├── config/                Environment loading and dependency wiring
│   ├── middleware/            Authentication guards, proxy checks and errors
│   ├── templates/             Contact and OTP email templates
│   ├── create-app.js          Express composition
│   └── index.js               Local/Vercel entrypoint
├── env/                      Private local configuration and public example
├── data-migration/
│   ├── scripts/               Seed generation, legacy export and Convex import
│   └── sql/                   Historical PostgreSQL migration
├── convex/                    Thin platform adapters and generated bindings
├── scripts/                   Operator, CLI, build and validation commands
├── tests/                     HTTP/service/DTO/configuration regression tests
└── convex-tests/              Atomic persistence and storage tests
```

The other server directories have separate roles: `server/content-contract` is
the browser-safe contract shared by the admin, API and data services;
`server/cms` is the legacy migration source. Neither is a second active API.

## Request flow

HTTP requests pass through middleware, a controller and a request DTO to a
service implementation. Services call repositories rather than accessing the
database or HTTP request directly. Response DTOs choose what is returned.

The content repository crosses the authenticated Convex bridge. Convex invokes
the data service within its mutation, using database and storage repositories.
This keeps OTP consumption, session rotation, publishing and migrations atomic.
The Convex schema reads the entity definitions; entity validators and indexes
remain unchanged by this organization.

The main modules are authentication, contact, content, email, CAPTCHA, passwords,
content persistence, authentication persistence, upload verification, cleanup and
data migration. Each has a service contract and an `Impl` class. Category,
project, skill, experience and education entries share the typed content module.

To add a use case, define its request/response DTOs and service contract, implement
the business behavior, add repository methods if needed, and inject the service
into a controller. Controllers should not import repositories or implementations.

## Configuration and commands

Copy `env/.env.example` to `env/.env.local`. Existing local files were moved into
`env` without changing their values. Injected deployment variables take precedence,
followed by `env/.env.local`, `env/.env`, and legacy root files when present.
Private files are ignored by Git. Vercel continues to use its configured variables.

Run commands from the repository root:

```sh
npm run dev:api
npm test --prefix server/api
npm run test:convex --prefix server/api
npm run lint --prefix server/api
npm run convex:dev
npm run migration:seed --prefix server/api
npm run migration:import --prefix server/api -- snapshot.json --validate-only
```

Convex commands go through `scripts/convex.js`, which loads the environment folder
and preserves the backend working directory. Migration commands keep snapshots in
the existing ignored `.backups` directory. Generating types or running tests does
not deploy code or migrate live data.
