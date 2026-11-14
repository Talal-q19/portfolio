# Data migration

`scripts/build-seed.js` reconstructs the committed baseline.
`scripts/export-legacy.js` backs up and exports the legacy CMS and accounts.
`scripts/import-convex.js` validates, imports and reconciles a private snapshot.
Use the package `migration:*` commands so paths remain independent of your shell.

The historical PostgreSQL migration is in `sql`. Runtime migration behavior lives
in `src/service/impl/DataMigrationServiceImpl.js` and uses repositories inside a
Convex mutation. Nothing in this directory runs automatically on application
startup. Snapshots remain in the ignored backend `.backups` directory.

See `docs/deployment.md` at the repository root for the controlled import workflow.
