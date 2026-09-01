# Form Embeds Render in the Page, Not in a Sandboxed Iframe

Date: 2026-09-01

Status: accepted

## Context

The three embed blocks (`genericEmbed`, `videoEmbed`, `formEmbed`) all rendered tenant-authored HTML inside a sandboxed iframe via `EmbedFrame`. When the snippet contains a `<script>`, `EmbedFrame` builds the document as a `blob:` URL, because Chromium will not re-execute `srcdoc` scripts after an SPA navigation.

NWAC's Donate & Membership page embeds the GoFundMe Pro (Classy) checkout SDK. Clicking **Donate** did nothing. The SDK's `modal.open()` calls `nav.setClassyParams()` → `history.pushState()` before it publishes its open event, and the push throws:

```
Uncaught SecurityError: Failed to execute 'pushState' on 'History': A history state object with URL
'https://nwac.avy-fx.org/2ecdc705-…?campaign=802015&frequency=one-time&amount=30' cannot be created in a
document with origin 'https://nwac.avy-fx.org' and URL 'blob:https://nwac.avy-fx.org/2ecdc705-…'.
```

A document can only have its URL rewritten to a URL that matches its own scheme, so a `blob:` (or `about:srcdoc`) document can never accept `pushState`. That is not a quirk of one provider: checkout SDKs routinely keep their state in the URL — Classy pushes `?campaign=…&frequency=…&amount=…` and then reads it straight back off `window.location.search` on the next tick. An iframe document that cannot hold a query string cannot host them.

Two further constraints ruled out simply giving the frame a real same-origin URL:

- Rewriting the frame's document URL to a real `https://` URL on the production page did make the SDK initialize and `pushState` succeed — but the SDK's payment overlay then rendered *inside* the embed iframe, which the iframe resizer collapses to its (now hidden) content height. The donor sees nothing.
- The sandbox was not buying much. `allow-scripts` plus `allow-same-origin` is the combination Chrome warns about in the console — "an iframe which has both … can escape its sandboxing" — because the frame can reach `parent` and drop its own `sandbox` attribute. The form block already allows `<script>` through DOMPurify, so the trust decision (an editor may paste a provider's script) was made when the block was created.

Tuning sandbox tokens per provider (`allow-storage-access-by-user-activation` for the reCAPTCHA warnings, and so on) was considered and rejected: it treats each new donation provider as an onboarding chore while still leaving `pushState` and the overlay broken.

Note that the block is not only used on donation pages. `Footer.tsx` renders it for `settings.footerForm` when the type is `embedded`, so the change also moves four tenants' newsletter forms — NWAC, Sierra, Sawtooth, Payette — out of an iframe and onto every page of their sites. Three of those snippets are Mailchimp forms carrying a `<style>` block, which is what forced the scoping decision below.

## Decision

`formEmbed` renders its sanitized HTML directly into the page. `EmbedFrame` and its sandboxes stay in place for `genericEmbed` and `videoEmbed`, which host passive content and gain nothing from a rewritable URL.

`FormEmbedBlockComponent` sanitizes with the same DOMPurify allowlist as before (minus the `sandbox` string, which no longer applies), then does two things the iframe used to do for free.

**Scoping the CSS.** Each `<style>` in the snippet is wrapped in `@scope ([data-form-embed="<id>"])` before it reaches the page, keyed to a `useId` value on that embed's container. Provider CSS is written for a document of its own, and Sawtooth's Mailchimp footer ships `html, body { … font-family: 'Lato' … }` alongside an `input, label, h2 { … !important }` override. In the page and unscoped, those rules restyle every heading and form control on the site, on every page, because the footer renders this block everywhere. `@scope` matches only inside the scoping root, so ancestors like `html` and `body` fall outside it, while the provider's own selectors keep their original specificity and their `!important` — verified in Chrome, including `@media` and `@keyframes` nested inside the wrapper. A browser without `@scope` drops the block, so the embed loses its styling rather than leaking it.

**Ordering the scripts.** A `<script>` parsed out of a string is inert, so each one is rebuilt as a fresh element. They are inserted one at a time, waiting on each non-`async` external script before inserting the next. Under the HTML parser a blocking external script also held back the scripts after it; with DOM insertion an inline script runs the instant it lands, so without the wait, Sawtooth's `jQuery.noConflict(true)` would execute before the `mc-validate.js` that defines `jQuery`. Eventbrite's embed has the same loader-plus-inline-call shape.

DOMPurify is not a meaningful boundary for this block. `script` is in its allowlist, so arbitrary inline JS passes through untouched; it removes markup an editor did not intend to write, not code they deliberately pasted. Nor was the sandbox it replaces one: `EmbedFrame` built the frame from a `blob:` URL, which inherits its creator's origin, and `allow-same-origin` then kept that origin — so the frame was already same-origin with the page and could reach `window.parent` and the session's `/api/*`. The real boundary, before and after this change, is who may edit content containing a `formEmbed`.

## Consequences

- The GoFundMe/Classy donate flow works: the form renders, `pushState` succeeds, and the payment modal overlays the page as the provider designed it. Verified against the live NWAC page.
- No per-provider sandbox allowlist to maintain. Onboarding a center on a new donation provider is a content task, not a code change.
- A script pasted into a form embed runs with the tenant origin's privileges, and `/admin` is served from that same origin (see `middleware.ts`), so it can drive the CMS API as whoever is viewing the page. This was equally true of the `blob:` iframe it replaces. The RBAC model has no capability to gate it on — the seeded `Forecaster` and `Non-Profit Staff` roles both hold `*` on `pages` and `posts` — so the control is who gets a content-editing account. Treat a provider swap as a change worth reviewing.
- Provider SDKs append their own nodes to `document.body` (modal roots, nudge trays) and register globals. Unmounting the block removes only the nodes it injected; the rest lives for the life of the page. Note that the provider script re-runs on every mount, so a client-side navigation away and back re-initializes the SDK on a page where its previous globals still exist.
- Provider CSS now only styles the embed. A snippet that relied on reaching outside it — restyling the page's fonts, say — silently stops doing so, which is the intended trade.
- Third-party `pushState` now touches the real page URL. The App Router tolerates this — the SDK pushes on open and pops the parameters back off on close.
