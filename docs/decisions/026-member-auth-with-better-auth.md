# Member Authentication with Better Auth

Date: 2026-10-28

Status: proposed

## Context

AvyWeb is becoming AvyApp's backend and the consumer identity provider for the Avy platform (see the *AvyApp Notifications Backend* design). That needs public accounts — **Members** — separate from staff **Users**, who sign into the admin under the RBAC model ([004](004-rbac.md), [012](012-non-rbac-access-patterns.md)). Members need anonymous accounts tied to an AvyApp device that can later be linked to email or social sign-in, and must work from AvyWeb (cookies, one host per tenant) and AvyApp (Expo).

Payload's built-in auth covers email/password and API keys, not anonymous accounts, OTP or social sign-in. Better Auth covers all of them (`anonymous`, `emailOtp`, social providers, `@better-auth/expo`), and Payload supports custom auth strategies per collection.

Constraints that shaped the decision:

- Production tenants are on separate registrable domains (`nwac.us`, `sierraavalanchecenter.org`, …), so browsers can't share one auth cookie across them, and a single cross-site auth origin is blocked by Safari ITP.
- Center pages run third-party scripts: form embeds render in the page, not a sandbox ([017](017-form-embeds-in-page.md)), and several centers' footers put a Mailchimp embed on every page. Anything a center page can do as the signed-in Member, those scripts can do too. Since [025](025-admin-served-only-from-the-apex.md) the apex is the origin that holds sessions and hosts no embeds.
- All auth collections' strategies run in one list on every request, and `req.user` holds one user. The admin session only exists on the apex, so a User and a Member session can only meet there.
- The database is SQLite/Turso ([002](002-sqlite-turso.md)); Payload's SQLite dev push diffs the live schema, and Turso ignores FK pragmas inside transactions.
- The only maintained Payload/Better Auth integration, `payload-auth`, assumes the Better Auth user collection is `admin.user` and replaces the admin login, and is tested only on Postgres.

## Decision

- **A new `members` auth collection**, distinct from `users`, with `disableLocalStrategy: true` and one custom strategy that resolves a Better Auth session to the Member. The strategy short-circuits when no Better Auth cookie is present, and yields whenever admin credentials (a `payload-token` cookie or `Authorization` header) are present, because Payload runs its own JWT strategy after every custom one; so an admin session always wins on admin and API routes. Public pages read the Member through Better Auth's `getSession`, not `req.user`.
- **Hybrid table ownership.** Payload owns `members` as a collection, with a text `id` so Better Auth generates Member ids the way it generates every other id; Better Auth's `user` model is mapped onto it with `modelName` alone, since Payload keys Drizzle columns by field name and Better Auth addresses columns by that key. Better Auth's `session`, `account`, `verification` and `rateLimit` tables are hand-maintained Drizzle tables injected through `afterSchemaInit` (their foreign keys need the built `members` table), so Payload migrations are the only migration system. Better Auth uses its Drizzle adapter on `payload.db.drizzle`, writing dates as the same ISO text Payload uses. `payload-auth` is not used.
- **Anonymous Members are device-bound and created lazily** by AvyApp on the first action that needs an identity. A custom Better Auth endpoint `/sign-in/device` exchanges a random device secret (hashed on the `Device`) for a session, and only while the Member is still anonymous. Linking happens in `onLinkAccount`: Devices, Subscriptions and Deliveries move to the Linked Member, Subscriptions are unioned, and the Anonymous Member is deleted.
- **The apex is the auth server and the account home.** Sign-in (email OTP, Google) happens only on the apex, branded per center by a parameter. A center host gets its own **site session** by a top-level redirect through the apex that hands back a one-time token, which the center host exchanges for a session cookie on its own domain. The return URL is validated against the hardcoded center list ([013](013-hardcoded-tenant-lookup.md)). Google's only redirect URI is the apex.
- **Site sessions are limited.** On a center host a Member can read and write preferences (site settings, dashboards, views) and nothing else. Account endpoints — delete account, change email, link or unlink sign-in methods, list or revoke sessions — answer only on the apex, where "Manage account" links go and where the Member is already signed in. The apex never hosts form embeds or other third-party content scripts.
- **Members stay signed in.** Site sessions and the apex session are 60-day rolling. Each center host also keeps a long-lived marker cookie saying this browser has had a site session; when the site session has expired and the marker is present, middleware silently redirects through the apex and back, signing the Member in again without a prompt (or clearing the marker if the apex session is gone too). Visitors without a marker are never redirected. The first visit to a new center takes one click on "Sign in", with no prompt.
- **AvyApp talks to the apex** with a full (not site-limited) session — it runs no embeds — and uses native Google (and later Apple) sign-in with `idToken`s.
- **Members and Users never link**, even with the same email.
- **Rate limits** are stored in the database; **OTP email** is Avy-branded via Payload's email adapter.
- **Account deletion** happens on the apex, confirmed by an emailed link (`sendDeleteAccountVerification`) as defense in depth, and uses Better Auth's `deleteUser` with a hook that deletes the Member's Payload rows explicitly rather than relying on FK cascades.

## Consequences

- Better Auth writes to `members` bypass Payload hooks and validation. Side effects belong in Better Auth `databaseHooks`; Payload hooks on `members` only fire for admin edits.
- The injected Better Auth tables must be updated by hand when a Better Auth upgrade or plugin adds a column, and their file must import Payload's Drizzle re-export to avoid a version mismatch.
- One account signs in across every center site without a shared cookie: a click (no prompt) on the first visit to a new center, silent after that.
- Site sessions put a session cookie back on center hosts, which [025](025-admin-served-only-from-the-apex.md) emptied. An embed script on a center page can act as the signed-in Member within the site session's limits — it can change preferences, which is accepted as low-stakes and reversible — but it cannot reach identity, membership or deletion. Keeping it that way means every new Member endpoint has to decide whether it is site-safe, and the apex must stay free of embeds; a regression in either reopens the exposure.
- Personalized center pages can't be personalized in the cached render ([011](011-incremental-static-regeneration.md)); the personal parts load client-side with the site session.
- Adding a center needs no OAuth configuration, only an entry in the center list. Sign-in pages need per-center branding.
- The silent re-sign-in redirect only fires for marked browsers, but it does add a round trip to the first page view after a site session expires.
- On Android, reinstalling the app loses SecureStore and therefore the device secret, so an unlinked reinstall starts a new Anonymous Member. iOS Keychain survives reinstall.
- POC 1 (spec in the monorepo at `.scratch/avy-app-notifications/poc-1-better-auth-members.md`) confirmed the hybrid tables on SQLite/libsql on 2026-10-29: dev push and `migrate:create` both carry the injected tables, and every done-means item passes in `src/scripts/poc/better-auth-members.ts`. The fallback of writing through Payload's Local API was not needed. How it all fits together is in [`../member-auth.md`](../member-auth.md).
