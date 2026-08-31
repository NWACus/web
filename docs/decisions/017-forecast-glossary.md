# Forecast glossary: national collection, client-side marking decoupled from the page cache

Date: 2026-06-22

Status: accepted

## Context

The legacy `afp-public-widgets` forecast widget surfaces a glossary: standard avalanche terms appearing in forecast prose get an underline, a hover tooltip with a plain-language definition, and a link to the matching avalanche.org encyclopedia page. We are rebuilding this on the native forecast page.

Two facts shaped the design:

- **There is no avalanche.org glossary API.** The 82 terms (the words/aliases to match, the definition text, and the encyclopedia URL) are hardcoded in the widget's `glossaryTerms.js`. avalanche.org is only the _link target_; the definitions are static copy.
- **Native forecast prose is server-rendered and heavily cached.** The live zone page is SSG + ISR (`revalidate=1800`); the dated archive pages are rendered once and cached `revalidate=2592000` (≈immutable). Forecaster HTML (bottom line, discussion, problem discussions) is sanitized server-side (`sanitize-html`) and injected via `dangerouslySetInnerHTML`.

We wanted the terms to be editable by NAC staff (not a code deploy), and we did **not** want editing a term to ripple across the forecast page cache.

## Decision

- **Carrier: a national, shared `GlossaryTerms` Payload collection** (outside per-Tenant isolation, like the Avalanche Education cluster). Fields: `term` (canonical, required), `aliases[]` (plurals/tenses/synonyms), `definition` (required), `link` (optional avalanche.org URL). Public read; super-admin (global role) write. Chosen over a code constant because the terms are a managed editorial surface, and over a per-tenant collection because the vocabulary is universal — per-center copies would only duplicate.

- **No per-center gate.** Glossary tooltips render on every native forecast whenever the national set is non-empty. (The widget had a per-center `widget_config.forecast.glossary` flag; we drop it — the vocabulary is universal and a center gains nothing by hiding it.)

- **Marking is client-side, fed by a dedicated endpoint with its own cache tag.** The forecast page is server-rendered _without_ glossary markup. A client island fetches the term list from `GET /api/glossary` (cached server-side, tagged `glossary`) and marks the already-rendered prose in the browser. Editing a Glossary Term fires `revalidateTag('glossary')`, which purges **only** that endpoint's response — **no forecast page is ever revalidated for a glossary change.**

  - The term list must be fetched by the client island from its own endpoint, **not** passed as a prop from the forecast server component — a prop would be serialized into the cached RSC payload and silently re-couple glossary edits to the page cache.

- **Scan / match semantics.** Scan the bottom line, forecast discussion, and each problem discussion; descend into `p`, `li`, and `figcaption` only; never mark inside existing links, headings, tables (they carry their own field-info tooltips), figures, or images. Matching is case-insensitive, whole-word, longest-match-first (so "Avalanche Path" wins over "Avalanche"), and marks every occurrence (widget parity).

- **Interaction.** A marked term is a focusable control that opens a popover containing the definition and a "Learn more on avalanche.org →" link. Hover/focus on desktop, tap on mobile — tapping shows the definition and never navigates away; leaving the forecast is an explicit second action. The mark pass is layout-neutral (decoration/color only, no reflow) and the affordance fades in, so the page paints identically with or without the glossary.

## Consequences

- A glossary edit is cheap and contained: one tag purge, zero forecast-page invalidation. Archive pages (≈immutable) always show the _current_ glossary for free, since marking happens at view time in the client.
- Cost: a small client island (matcher + popover lib + the term list, a few KB) and a brief, layout-neutral fade-in of the affordance after hydration. No-JS readers see fully readable prose without tooltips — acceptable, as the glossary is an enhancement.
- The marking decision deviates from "everything else is server-rendered." The driver is cache decoupling, not performance (SSR cost is negligible and amortized by ISR). This is the surprising part a future reader should understand: client-side here is _on purpose_, to keep a frequently-editable national collection out of the forecast page cache.

## Alternatives considered

- **Code constant (port `glossaryTerms.js`)** — simplest, no infra, but not editable without a deploy. Rejected: we want NAC staff to manage terms in the CMS.
- **Server-side marking** (mark during render, bake anchors into the HTML) — gives SSR/no-JS links, but couples a cross-tenant collection to the entire forecast page cache: a one-word edit would invalidate every tenant's live + archive forecast pages. The SSR/SEO upside is marginal (the prose text is server-rendered regardless; the only deferred part is outbound links to avalanche.org). Rejected for the coupling.
- **Per-tenant `GlossaryTerms` collection** — rejected: the vocabulary is universal; per-center sets would mostly duplicate and drift.
- **Term list passed as a prop from the server component** — rejected: bakes the list into the cached RSC payload, re-coupling edits to the page cache.
