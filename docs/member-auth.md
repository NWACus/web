# Member auth (Better Auth on Payload)

How public **Members** sign in, as decided in [ADR 026](decisions/026-member-auth-with-better-auth.md) and proven by POC 1. Terms (Member, Anonymous Member, Linked Member, Membership, Device, Subscription) are in [`GLOSSARY.md`](../GLOSSARY.md#members). Staff **Users** are a different thing entirely: they sign into the admin with Payload's own auth and never link to a Member.

## Pieces

| Piece | Where |
| --- | --- |
| `members` collection, access control, Payload auth strategy | `src/collections/Members/` |
| Owned rows: Memberships, Devices, Subscriptions, Deliveries | `src/collections/{Memberships,Devices,Subscriptions,Deliveries}/` |
| Better Auth server (plugins, rate limits, email, deletion) | `src/auth/members/getMemberAuth.ts` |
| Better Auth's own tables, injected into Payload's Drizzle schema | `src/auth/members/schema.ts` |
| Host rules: apex vs center hosts, `allowedHosts` | `src/auth/members/hosts.ts` |
| Site-session hand-off and endpoint allowlist | `src/auth/members/plugins/siteSession.ts`, `src/auth/members/siteSessionPolicy.ts` |
| Device-bound sign-in for Anonymous Members | `src/auth/members/plugins/deviceSignIn.ts` |
| Anonymous → linked account merge | `src/auth/members/linkAnonymousMember.ts` |
| Silent re-sign-in decision used by middleware | `src/auth/members/silentReSignIn.ts`, `src/middleware.ts` |
| HTTP mount | `src/app/api/auth/[...all]/route.ts` (more specific than Payload's `/api/[...slug]`) |
| Apex sign-in and account pages (POC-grade) | `src/app/(frontend)/members/`, `src/components/Members/` |
| Floating Member tag on center sites | `src/components/Members/MemberTag.tsx`, rendered by `src/app/(frontend)/[center]/layout.tsx` |
| Membership on first site session, center-scoped preferences | `src/auth/members/memberships.ts` |
| End-to-end harness | `src/scripts/poc/better-auth-members.ts` |

## Hybrid tables

Payload owns `members`; Better Auth's `user` model is mapped onto it with `user.modelName: 'members'`. Four things make that mapping clean on SQLite/libsql:

- **Text ids.** `members` declares its own `id: text` field, so Better Auth generates ids for Members the same way it does for sessions and accounts. Nothing uses `useNumberId`.
- **No field mapping.** Payload keys its Drizzle columns by field name (`createdAt`) and names the SQL column in snake_case (`created_at`). Better Auth addresses columns by Drizzle key, so its default field names line up with Payload's with no `fields` config.
- **Dates are ISO text.** Payload stores timestamps as ISO-8601 text. Better Auth's Drizzle adapter (1.7+) writes `Date`s to `text()` columns as the same ISO string and parses them back, so `created_at` is readable by both.
- **`afterSchemaInit`, not `beforeSchemaInit`.** The session and account tables carry a foreign key to `members`, which only exists after Payload has built its tables. Tables added there are part of `adapter.schema`, so dev push and `migrate:create` both see them (the migration `20261029_062108_poc_members_better_auth` has all five tables).

Better Auth writes to `members` through Drizzle, so Payload hooks and validation on `members` run only for admin edits. Side effects for Better Auth writes belong in `databaseHooks` (the `user.create.after` hook is the PostHog identify point).

The four Better Auth tables (`members_sessions`, `members_accounts`, `members_verifications`, `members_rate_limits`) are hand-maintained in `schema.ts` from Better Auth's core schema plus the session `additionalFields` (`scope`, `siteHost`). When a Better Auth upgrade or plugin adds a column, add it there and generate a migration; the harness fails on the first write to a missing column.

## Strategy and isolation

`memberSessionStrategy` turns the `avy.session_token` cookie into `req.user` with `collection: 'members'`. Payload runs every auth collection's strategies on every request and its own JWT strategy **last**, so the strategy yields (`user: null`) whenever a `payload-token` cookie or `Authorization` header is present: with both sessions in one browser the admin session wins on admin and API routes. It also returns early when no Better Auth cookie is present, so unauthenticated and admin traffic never pays for a session lookup.

A Member is never a User: `isMember()` and `isUser()` narrow on `collection`, the admin redirects a Member to `/admin/unauthorized`, and reading `users` as a Member is forbidden. Public pages read the Member through Better Auth's `getSession`, not `req.user`.

Tenant admins see only Members holding a Membership with a center they administer (`readMembers`), by collecting Membership rows for their tenants. Super admins see everyone; a Member sees only itself.

Signing in on a center's site is a Membership: the exchange endpoint records a `signup` Membership with that center the first time it hands the Member a site session (`ensureCenterMembership`), so Members who arrive through a center are visible to its admins. The only other kind, `donor` (a donation or a paid center membership), will come from those flows. Preferences live in two places: global ones on the Member, center-scoped ones on the Membership, written through `/member-preferences/set` with `scope: 'global'` (default) or `'center'`; `/member-preferences/get` returns both.

## Hosts and site sessions

The apex (`ROOT_DOMAIN`) is the auth server and account home. `baseURL.allowedHosts` lists the apex, every `<slug>.<ROOT_DOMAIN>` and every center custom domain, and Better Auth resolves the base URL per request. A `before` hook refuses everything but the site-safe paths (`get-session`, `sign-out`, the exchange, the preference endpoints) when the request host is a center host, and refuses the account paths (delete, change email, link/unlink, sessions) for any session whose `scope` is `site`.

Hand-off: a center "Sign in" link goes to `apex/api/auth/site-session/handoff?returnTo=<center url>`. With an apex session the endpoint mints a 60-second one-time token stored in `members_verifications` (hashed) and redirects to `<center>/api/auth/site-session/exchange?token=…&returnTo=<path>`, which consumes the token, creates a session with `scope: 'site'`, sets the session cookie plus a 400-day `avy.site_member` marker, and redirects to the path. Without an apex session the handoff sends the browser to `/members/sign-in` (or, with `silent=1`, back to the center with `clear=1` to drop the marker). `validateReturnTo` only accepts center hosts over the configured protocol; `safeLocalPath` keeps the final redirect on the center host. The `oneTimeToken` plugin was not used: its verify endpoint cannot mark the new session as site-scoped, and the custom endpoint is about forty lines.

On center pages `MemberTag` floats bottom-right (fixed, so no layout shift), reads the session client-side, and offers "Sign in" (the apex hand-off with the current URL as `returnTo`) or, signed in, "Manage account" on the apex and sign out.

Silent re-sign-in: `silentReSignInRedirect` runs in middleware for GET page requests on a center host that carry the marker but no session cookie, and redirects through the handoff with `silent=1`. Prefetches never redirect. Locally the Next dev server relativizes that `Location` because `localhost:<port>` is both the server origin and the apex; deployed hosts differ, so the redirect stays absolute.

## Devices, linking, deletion

- `POST /device/register` (session required) binds an install id to the Member and stores a SHA-256 of the device secret. `POST /sign-in/device` trades the secret for a session while the Member is anonymous and returns 403 once it is linked.
- Linking runs in the anonymous plugin's `onLinkAccount`: Devices and Deliveries move to the Linked Member, Subscriptions are unioned and deduped on center × zone × category × channel, a Membership moves unless the Linked Member already has one with that center. Better Auth then deletes the Anonymous Member, its sessions and accounts.
- `POST /delete-user` on the apex emails a confirmation link; the callback runs `deleteMemberRows` (Deliveries, Subscriptions, Devices, Memberships) before Better Auth removes sessions, accounts and the Member. Deleting a Member in the admin runs the same cleanup plus the Better Auth rows through the collection's `beforeDelete`. Nothing relies on FK cascades.

## Email, rate limits, Google, env

OTP and deletion emails render React Email templates through `payload.sendEmail`. Better Auth sends them as a background task after responding; on Vercel wire `advanced.backgroundTasks.handler` to `waitUntil` before relying on it in production.

Rate limits are stored in `members_rate_limits`, keyed on `x-forwarded-for`, with tight rules on `/email-otp/send-verification-otp` (3/min), `/sign-in/anonymous` (5/min) and `/sign-in/device` (10/min). `MEMBER_AUTH_RATE_LIMIT=false` turns them off locally.

Google is configured only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. `clientId` is an array: Better Auth verifies native `idToken`s against every entry, so the iOS, Android and preview-Android client ids go in `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` and `GOOGLE_ANDROID_PREVIEW_CLIENT_ID`. The only redirect URI is the apex callback.

## Running the harness

```sh
cp dev.db .context/poc.db
DATABASE_URI=file:./.context/poc.db NEXT_PUBLIC_ROOT_DOMAIN=localhost:55120 \
  TSX_TSCONFIG_PATH=tsconfig.scripts.json \
  pnpm payload run src/scripts/poc/better-auth-members.ts
```

It drives Better Auth's handler with apex and center `Host` headers and asserts every done-means item of POC 1 against Payload's Local API. `tsconfig.scripts.json` gives tsx the automatic JSX runtime the email templates need. Always start from a fresh copy: a run that stops mid-push leaves the scratch file unusable.
