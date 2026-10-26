# Admin is served only from the apex

Date: 2026-10-22

Status: accepted

## Context

Since #203 — Admin panel on tenant-scoped subdomain/custom domain, `/admin` has been served from every host: the apex (`www.avy-fx.org`), each center's subdomain (`nwac.avy-fx.org`), and each production center's custom domain (`nwac.us`). `middleware.ts` lets `/admin` through on all three and sets the `payload-tenant` cookie from the host, so a center host selects its own tenant.

The `payload-token` session cookie is host-scoped (Payload's default; `Users` sets no `cookies.domain`). So on a center host, the admin session, the CMS API and the public pages all share one origin. ADR [017](017-form-embeds-in-page.md) lets form embeds run provider scripts in the page. Any such script on a center host can call `/api/*` as the logged-in editor viewing it, and CSRF/CORS never engage because the request is same-origin. #1252 — Serve /admin only from the apex, not tenant subdomains/custom domains (reverses #203) reproduced this locally: a `POST /api/pages` carrying only the cookie, with no CSRF token, returned 200.

Serving admin from several hosts has also produced a steady run of bugs: host-dependent tenant-selector behavior (#602 — Bug: tenant cookie not set for single-tenant users on root domain, #1426 — fix(tenancy): keep the subdomain's tenant selected after admin login), cookie-domain mismatches (#425 — Mismatch between root domain env var and cookie domain causes permissions errors), and custom-domain preview 404s (`middleware.ts` skips its custom-domain branch for any path containing `/next/`). Meanwhile, editors are already onboarded to the apex.

## Decision

The admin panel and its authenticated session live only on the apex.

- On center subdomains and custom domains, middleware redirects `/admin*` to the same path on the apex and expires that host's `payload-token`.
- `/api/*` stays reachable on center hosts, because public pages use it (form submissions, the cached tenant lookup). Embeds can no longer act as an editor because center hosts never hold a session cookie, not because `/api` is blocked there.
- The tenant selector is the only way to choose a center in the admin. A host no longer implies a tenant.
- Admin URLs in invite, accept-invite, forgot-password, embed-generator and preview links always point at the apex. They no longer use the request's host.

## Consequences

- An embed on a center's public site can no longer use an editor's session. This replaces the "control is who gets a content-editing account" mitigation noted in ADR 017.
- Same-origin, on-page editing for center sites is off the table: no admin bar on the public site (#231 — User knows when they are viewing a preview) and no "edit this page" in place (#617 — Feature Request: Ability to Edit Pages from the Page Itself). Getting either back would need a separate cookie-scoped admin origin plus a cross-origin sandbox for embeds.
- Preview has to work from the apex for every center. Today it serves the page at `/<center>/<slug>` on the root host, which breaks center-relative links (#1331 — Admin preview serves pages on the root host, breaking every center-relative link). The fix is chosen in #1252: either make links work in the path form during draft mode, or have the admin mint a short-lived signed token that turns on draft mode on the center's own host.
- Host-specific code paths and docs go away: the subdomain branches in the tenant selector, the "Tenant Subdomain" section of `docs/tenant-selector.md`, and the `/admin` passthrough branches in `middleware.ts`.
- Bookmarks to `<center>/admin` keep working through the redirect, but editors are signed out once and have to log in on the apex.
