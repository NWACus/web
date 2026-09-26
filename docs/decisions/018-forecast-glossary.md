# Forecast glossary: national collection, client-side marking decoupled from the page cache

Date: 2026-06-22

Status: accepted (amended 2026-09-24 — per-center gate reinstated; Shared Content access; widget's scan scope)

## Context

The legacy `afp-public-widgets` forecast widget surfaces a glossary: standard avalanche terms appearing in forecast prose get an underline, a hover tooltip with a plain-language definition, and a link to the matching avalanche.org encyclopedia page. We are rebuilding this on the native forecast page.

Two facts shaped the design:

- **There is no avalanche.org glossary API.** The 82 terms (the words/aliases to match, the definition text, and the encyclopedia URL) are hardcoded in the widget's `glossaryTerms.js`. avalanche.org is only the _link target_; the definitions are static copy.
- **Native forecast prose is server-rendered and heavily cached.** The live zone page is SSG + ISR (`revalidate=1800`); the dated archive pages are rendered once and cached `revalidate=2592000` (≈immutable). Forecaster HTML (bottom line, discussion, problem discussions) is sanitized server-side (`sanitize-html`) and injected via `dangerouslySetInnerHTML`.

We wanted the terms to be editable by NAC staff (not a code deploy), and we did **not** want editing a term to ripple across the forecast page cache.

## Decision

- **Carrier: a national, shared `GlossaryTerms` Payload collection** (outside per-Tenant isolation, like the Avalanche Education cluster). Fields: `term` (canonical, required), `aliases[]` (plurals/tenses/synonyms), `definition` (required), `link` (optional avalanche.org URL). It is Shared Content ([ADR 022](022-shared-content.md)): write comes from a Global Role rule, admin/REST read is structural, and the public never reads the collection, only the glossary's own endpoint. A term or alias belongs to at most one Glossary Term, since a second claim would never show. _Amended 2026-09-24; originally "public read; super-admin write"._ Chosen over a code constant because the terms are a managed editorial surface, and over a per-tenant collection because the vocabulary is universal — per-center copies would only duplicate.

- **Per-center gate: honor the AFP's `widget_config.forecast.glossary` flag.** Glossary tooltips render on a native forecast only when the center's flag is on and the national set is non-empty; the client island does not mount, and does not fetch the term list, when it is off. _Amended 2026-09-24._ The original decision dropped the flag because the vocabulary is universal. Reversed: every other native product honors the center's AFP settings (`platforms.*`, the danger map and station map `widget_config` blocks), and SNFAC has the flag off today, so dropping it would switch on a feature a center turned off. The flag stays upstream and read-only for us, like the other capability flags.

- **Marking is client-side, fed by a dedicated endpoint with its own cache tag.** The forecast page is server-rendered _without_ glossary markup. A client island fetches the term list from `GET /api/glossary` (cached server-side, tagged `glossary`) and marks the already-rendered prose in the browser. Editing a Glossary Term fires `revalidateTag('glossary')`, which purges **only** that endpoint's response — **no forecast page is ever revalidated for a glossary change.**

  - The term list must be fetched by the client island from its own endpoint, **not** passed as a prop from the forecast server component — a prop would be serialized into the cached RSC payload and silently re-couple glossary edits to the page cache.

- **Scan / match semantics.** Scan the bottom line (on the zone page and each card of the all-zones page), the forecast discussion, each problem discussion, and the Mountain Weather discussion wherever it renders (inline on the forecast, the standalone weather page, the weather archive). Mark only text inside a `p` or `li`, never inside links, buttons, headings, tables (they carry their own field-info tooltips), figures, figcaptions, or images, and never inside a `div` or `i` below the `p`/`li`. Matching is case-insensitive, whole-word, longest-match-first (so "Avalanche Path" wins over "Avalanche"), and marks every occurrence, within a single text node (so `<strong>wind</strong> slab` is not "wind slab"). _Amended 2026-09-24:_ the original text descended into `figcaption`; the widget never marked captions, and a caption sits inside a figure that opens the lightbox, so we match the widget.

  Deliberate differences from the widget's mark.js pass, all found while matching it:

  - **The forecast discussion is marked.** The widget marked it until February 2025, when `afp-public-widgets` commit `60220f46` ("include forecast product discussion in lightbox media") switched the discussion from `v-html` to being written in by hand for the lightbox. That write lands after the mark pass, so the glossary dropped out of the discussion as a side effect, not a decision. Marking it restores the widget's intended behavior.
  - **Whole words.** mark.js matched a term only between whitespace, so "slab." or "slabs," went unmarked. We match up to punctuation, but, like the widget, treat a hyphenated word as one word: "human-triggered" does not match "triggered". A hyphenated form is a term or alias of its own, spelled with the hyphen (the legacy list has "cross-loaded" and "melt-freeze").
  - **Longest match first.** mark.js tried terms in list order, so "Avalanche" claimed the start of "Avalanche Path" and "Slab" the end of "wind slab".
  - **Exclusions hold at any depth.** mark.js checked only a text node's immediate parent, so it marked `<a><strong>avalanche</strong></a>` (a link inside a link) and a paragraph inside a table cell. We check every ancestor.
  - **No diacritic folding.** mark.js let "e" match "é"; the terms are English and the forecasts are too.
  - **Half sizes are not whole sizes.** "D1.5" is left alone rather than read as "D1".

- **Interaction.** A marked term is a focusable control that opens a popover containing the definition followed by a "Learn more" link with the external-link icon, opening the avalanche.org page in a new tab. Hover/focus on desktop, tap on mobile — tapping shows the definition and never navigates away; leaving the forecast is an explicit second action. This departs from the widget, where clicking a term opened avalanche.org: a phone has no hover, so there a tap was the only way to reach the definition, and it took the reader off the forecast instead. The widget reported hovers and clicks to Google Analytics; native glossary analytics are deferred to the AvyWeb-wide PostHog rework rather than added piecemeal here. The mark pass is layout-neutral (decoration/color only, no reflow) and the affordance fades in, so the page paints identically with or without the glossary.

## Consequences

- A glossary edit is cheap and contained: one tag purge, zero forecast-page invalidation. It reaches readers within about two minutes: the purge clears the cached read, and the endpoint's CDN copy lives a minute plus a minute of stale-while-revalidate. Archive pages (≈immutable) always show the _current_ glossary for free, since marking happens at view time in the client.
- Cost: a small client island (matcher + popover lib + the term list, a few KB) and a brief, layout-neutral fade-in of the affordance after hydration. No-JS readers see fully readable prose without tooltips — acceptable, as the glossary is an enhancement.
- The marking decision deviates from "everything else is server-rendered." The driver is cache decoupling, not performance (SSR cost is negligible and amortized by ISR). This is the surprising part a future reader should understand: client-side here is _on purpose_, to keep a frequently-editable national collection out of the forecast page cache.

## Alternatives considered

- **Code constant (port `glossaryTerms.js`)** — simplest, no infra, but not editable without a deploy. Rejected: we want NAC staff to manage terms in the CMS.
- **Server-side marking** (mark during render, bake anchors into the HTML) — gives SSR/no-JS links, but couples a cross-tenant collection to the entire forecast page cache: a one-word edit would invalidate every tenant's live + archive forecast pages. The SSR/SEO upside is marginal (the prose text is server-rendered regardless; the only deferred part is outbound links to avalanche.org). Rejected for the coupling.
- **Per-tenant `GlossaryTerms` collection** — rejected: the vocabulary is universal; per-center sets would mostly duplicate and drift.
- **Term list passed as a prop from the server component** — rejected: bakes the list into the cached RSC payload, re-coupling edits to the page cache.
