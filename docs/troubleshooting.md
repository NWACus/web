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

## Pre-commit fails on `drift:check` ("stale doc" / "broken link")

A doc is bound to code that changed, or a markdown link points nowhere. Re-read the flagged doc, update it if needed, then re-confirm the binding:

```bash
drift refs <changed-file>                                   # which docs cover this file
drift link <doc-path> <changed-file> --doc-is-still-accurate # after reviewing the doc
```

Always run `pnpm drift:check`, never raw `drift check` — see the **Doc Drift** section in [`../CLAUDE.md`](../CLAUDE.md).
