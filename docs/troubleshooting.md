# Troubleshooting

Common local-dev failures and how to resolve them. For project conventions see [`coding-guide.md`](coding-guide.md); for new-tenant setup see [`onboarding.md`](onboarding.md); for migration mechanics see [`migration-safety.md`](migration-safety.md).

## A tenant site doesn't load (or you always get the same one) at `localhost:3000`

AvyWeb resolves the active avalanche center from the request's subdomain. Plain `localhost:3000` has no tenant subdomain, so per-center pages won't resolve correctly.

Add the local subdomains to `/etc/hosts`:

```
127.0.0.1       dvac.localhost
127.0.0.1       nwac.localhost
127.0.0.1       sac.localhost
127.0.0.1       snfac.localhost
```

Then browse to `http://nwac.localhost:3000` (or `dvac.`, `sac.`, `snfac.`). The admin panel lives at `http://localhost:3000/admin`. See [ADR-007](decisions/007-dynamic-tenants-middleware.md) and [ADR-013](decisions/013-hardcoded-tenant-lookup.md) for how tenant resolution works.

## `pnpm seed` fails with `NOT NULL constraint failed: event_tags.tenant_id`

```
DrizzleQueryError: Failed query: delete from "tenants"
  cause: SqliteError: NOT NULL constraint failed: event_tags.tenant_id
```

**The seed cannot be run twice against the same database.** A first seed into an empty `dev.db` succeeds; a second one fails here, whatever the schema's age. Nothing about your data is wrong — the seed just cannot clear what it made.

The non-incremental seed clears every collection in parallel (`Promise.all` over `collections` in `src/endpoints/seed/index.ts`), so `tenants` is not guaranteed to be deleted after the collections that point at it. Three tenant-scoped tables — `event_tags`, `event_groups` and `settings` — are generated with `tenant_id integer NOT NULL` **and** `FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE set null`. Those two are contradictory: when `tenants` goes first, the cascade tries to write `NULL` into a `NOT NULL` column and the statement aborts. On an empty database there is nothing to cascade to, which is why the first seed is fine.

Either of these gets you moving:

```bash
pnpm reseed                          # incremental — skips the clearing step entirely
```

```bash
cp dev.db /tmp/dev.db.bak            # only if you have local admin content worth keeping
rm -f dev.db dev.db-shm dev.db-wal   # seed into an empty database
pnpm seed:standalone                 # or `pnpm seed` if a dev server is running
```

The underlying fix belongs in the schema: a *required* tenant relationship should generate `ON DELETE cascade`, not `set null`. Until that lands this is a workaround, not a resolution.

## The `afp-products` E2E suite fails wholesale with locator timeouts

Every native product spec times out waiting for content that is plainly on the page in a browser. Check the rollout flags first:

```bash
sqlite3 dev.db "select t.slug, s.native_products_forecast from settings s join tenants t on s.tenant_id = t.id order by t.slug;"
# expected: dvac|1  nwac|0  sac|0  snfac|1
```

With the flag off, every native page renders the `NACWidget` branch instead, so `<main>` contains `widget-container` and none of the markup the specs look for. `globalSetup` does not check this — it verifies the server is the mocked production build and that every upstream call had a golden behind it, but not the seeded rollout state — so the symptom is ~20 unrelated-looking timeouts rather than one clear message. Seed the database (see above) and re-run; `pnpm test:e2e:afp-products` rebuilds, which it must, because the flag is read at prerender time. See [afp-products/e2e-mocks.md](afp-products/e2e-mocks.md#rollout-state-lives-in-the-seed).

## Pre-commit fails on `drift:check` ("stale doc" / "broken link")

A doc is bound to code that changed, or a markdown link points nowhere. Re-read the flagged doc, update it if needed, then re-confirm the binding:

```bash
drift refs <changed-file>                                   # which docs cover this file
drift link <doc-path> <changed-file> --doc-is-still-accurate # after reviewing the doc
```

Always run `pnpm drift:check`, never raw `drift check` — see the **Doc Drift** section in [`../CLAUDE.md`](../CLAUDE.md).
