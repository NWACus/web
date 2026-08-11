# Native Product Pages — Scope

Status: draft for review
Last updated: 2026-08-11

## What this is

Avalanche center websites on AvyWeb currently display the National Avalanche Center's forecasts, observations, warnings, danger map, weather and media by embedding widgets from the `afp-public-widgets` repo — a separate Vue application loaded from a CDN and injected into the page at runtime. This project replaces those embedded widgets with **native AvyWeb pages**.

**"Native" means AvyWeb builds and serves the page itself.** Today, an AvyWeb page arrives in the reader's browser with an empty placeholder where the forecast goes; a script then loads from an external server, calls the AFP API from the reader's browser, and fills the placeholder in. Natively, AvyWeb calls the AFP API from its own servers, renders the forecast into the page ahead of time, and sends a complete page. The data still comes from the AFP — that does not change. What changes is who assembles the page, and when.

### How that works

For readers who want the mechanics. AvyWeb is a Next.js application with Payload CMS running inside it — one codebase, one deployment, serving every center's site with the center resolved from the domain.

- **The page is assembled on our servers.** Next.js renders the forecast components server-side, so the HTML that reaches the browser already contains the danger ratings, problems and discussion. No client-side fetch stands between the reader and the forecast.
- **Pages are generated in advance.** At build time AvyWeb enumerates every forecast zone of every center and pre-renders a page for each, then refreshes them on a short cycle (currently five minutes). A request is normally answered by a page that already exists, which is where the speed comes from.
- **Freshness is checked per view.** The refresh cycle alone would allow a window where a corrected or withdrawn forecast is still being served. So each view also asks the AFP whether the product has changed since the page was generated, and refreshes it if so. The pre-generation is the fast path; this is the safety net.
- **Product pages are ordinary AvyWeb pages.** Because Payload and the product pages are the same application, a forecast renders through the same pipeline as a center's blog posts and landing pages — same layout, same components, same design system, same deploy. This is the structural reason the design consistency problem goes away rather than being papered over: the widget was a foreign object embedded in a page, and a native page is just a page.
- **The rollout flag lives in Payload.** Each center's settings carry a per-product native/widget switch, so flipping a product — or reverting it — is a settings change rather than a deploy.
- **Pages never read the API directly.** Every product goes through an adapter that converts the AFP response into one internal format the components consume. This is what makes the new products API a configuration change rather than a rewrite, and it is why the foundation work below exists.

This document defines what is in scope, what is out of scope, and what is still undecided. The [work breakdown](#work-breakdown) lists the actual pieces of work; each becomes a GitHub issue in `NWACus/web`, grouped under a single parent issue, and those issues are where day-to-day status lives.

## Why we're doing it

**Speed** Today a reader waits through a chain of steps before seeing a forecast: load the page, download a script from another server, run it, call the API, render. Every one of those is a chance to be slow, and the reader watches an empty box for all of it. Native pages can be generated in advance and served complete, so the forecast is on screen almost immediately. On a mobile connection at a trailhead, that difference is the whole experience. It also means search engines can actually read the forecast, which they can't today.

Generating pages in advance trades away built-in forecast freshness from client-side fetching, so native pages have to actively guarantee freshness rather than getting it for free. That is a solved problem — pages re-check the forecast on view and refresh when it has changed — but it is a constraint we had to meet, not a benefit we gained.

**Design consistency** Native pages use the AvyWeb design system and look like the site they're on.

**Control and ability to iterate** Integrating the display of AFP products into AvyWeb allows us to iterate on design more easily and to experiment with new features. See [What this enables](#what-this-enables).

## What "done" means

**AvyWeb can display all AFP product data through native implementations, with the ability to fall back to widgets if needed.**

The widgets are not deleted. Each center can switch each product between native and widget independently, so anything that looks wrong can be reverted immediately without a deploy.

AvyWeb embeds exactly six widgets today. Each needs a native implementation:

| Widget           | What it shows                                                    | Where it appears on AvyWeb                     |
| ---------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| **forecast**     | The avalanche forecast — danger ratings, problems, discussion    | Zone forecast pages and the all-zones overview |
| **map**          | The danger map — zones colored by rating                         | Center home pages                              |
| **warnings**     | Warning / watch / special bulletin banners                       | Center home pages                              |
| **observations** | Public field and avalanche observations, and the submission form | Observation pages                              |
| **stations**     | Weather station data                                             | The stations map                               |
| **media**        | Photo and video galleries                                        | Anywhere an editor places the block            |

Every behavior the widgets have today must be **replaced, rebuilt, or explicitly dropped** — nothing gets left unexamined. The [parity ledger](#reference-material) is the checklist that enforces it.

## Approach: rebuild now, redesign later

**This project is a re-implementation, not a redesign.** The goal is to reproduce what the widgets do today, as they do it today, on AvyWeb's design system. Where the native version looks different, that is the design system applying — not a decision to present the product differently.

This is deliberate, and it is the single most important thing to understand about the scope. Rebuilding and redesigning at the same time would make it impossible to tell a bug from an intended change, and these are life-safety products where that distinction matters. Holding presentation constant means any difference between the widget and the native page is a defect, which is a question we can actually answer.

Redesign comes after, and gets easier the moment this lands. See [what this enables](#what-this-enables).

A small number of behaviors do intentionally differ, where reproducing the widget exactly would be wrong on AvyWeb — for example, clicking a zone on the danger map now opens the native forecast page rather than sending the reader off to the center's own website. These are recorded as deliberate departures rather than gaps, and are worth a read by anyone who knows the widgets well.

## Scope

- **All six widget surfaces**, rebuilt natively at functional parity.
- **Public views only.** Everything forecasters and administrators use stays in the AFP dashboard.
- **Per-center, per-product rollout**, so centers move one product at a time and can fall back instantly.
- **Support for the AFP's new products API**, so AvyWeb can move off the legacy API per product without rewriting pages.

## Work breakdown

Three groups. Each item below becomes a GitHub issue.

### Foundation

Built once; everything else depends on it. Not visible on any page, but it determines whether the rest is cheap or expensive.

- **Data layer and rollout controls.** Every product is fetched through an adapter that converts it into a single internal format, and pages never read the API directly. Two consequences: switching a product from the old API to the new one is a configuration change rather than a rewrite, and each center can turn each product native independently.
- **Automated test coverage.** End-to-end tests against fixed data, so a rendering or data bug is caught before a center sees it.
- **Architecture decisions and shared vocabulary**, written down so the reasoning survives the people who made it.
- **New API support.** The AFP is rewriting its products API. The adapter is designed for that switch, but the implementations still have to be written and verified against a deployed version.
- **Producer-side contract checks.** AvyWeb's expectations of the API get added to the AFP's own test suite, so breaking changes are caught upstream rather than by our readers. This includes capturing real examples of the awkward data shapes the widgets handle by special-casing — one of which only occurs during an active avalanche warning and therefore cannot be captured until the season starts.

### Widget replacement

The visible work, one group per widget.

- **Forecast** — the forecast page, a date picker for browsing past forecasts, glossary tooltips on avalanche terms, the forecast archive browser, danger-over-time charts, media embedded in forecaster-written discussion, and print-to-PDF.
- **Warnings** — the active warning, watch and special-bulletin banners.
- **Danger map** — the zone map, including hover and click behavior, off-season states, warning indicators, and **information-exchange mode** (a variant that hides the danger scale and pivots the map popup to observations, required by the info-exchange sites onboarding this season).
- **Observations** — the public observation and avalanche viewer, detail pages, and anonymous public submission with spam protection. Submissions continue to be moderated in the AFP dashboard.
- **Weather** — the mountain weather page. Two data sources behind one page: the traditional AFP weather product used by most centers, and NWAC's own Mountain Weather Forecast, currently being migrated out of a legacy system.
- **Stations** — the station map. Station tables, graphs, downloads and accumulations are already native.
- **Media** — see the open question below.
- **Analytics.** The widgets report usage to Google Analytics. Native pages report to PostHog, which AvyWeb already uses. Tracked in [#1136](https://github.com/NWACus/web/issues/1136).

### Beyond parity

Work that isn't replacing a widget, and only becomes possible once the foundation exists.

- **Combined map view** — danger, observations and stations together on a single map with real controls. No widget has an equivalent. It is also the test of whether the architecture worked: if it needs significant new data work rather than being purely a presentation change, the foundation was built wrong.
- **Layout variant machinery** — the ability to serve more than one layout of the same product and record which one a reader saw. This is what makes A/B testing and reader-chosen layouts possible; both are described in [what this enables](#what-this-enables). The approach is already decided — a cookie selects the variant, the page is served from a matching pre-generated route, and PostHog records the outcome — and it preserves the speed benefit rather than trading against it. Deliberately not built until there is a real experiment to run, since variants with nothing to compare are cost without benefit. The data layer is already being built to accommodate it: pages are compositions of products rather than products with pages welded on, so a new layout is a new composition rather than new data work.

## Out of scope

Discussed and deliberately excluded.

- **Forecaster and administrator views.** Writing forecasts, moderating observations, managing center settings — all stay in the AFP dashboard. No admin surface is being rebuilt or moved.
- **Embedding native pages in WordPress sites.** Centers not on AvyWeb use WordPress and embed the widgets. Native pages are pages, not embeddable widgets, and are not a replacement for those centers. This project delivers nothing consumable by a non-AvyWeb site.
- **Redesign of any product page.** See [approach](#approach-rebuild-now-redesign-later).
- **The synopsis / blog view.** A blog surface belonging to the widgets. AvyWeb already has its own blog, so this looks genuinely redundant rather than missing — worth confirming before it is dropped for good.
- **Signed-in observation submission.** Public submission is anonymous, matching the mobile app. Submitting as a known member would require identity infrastructure that isn't in place.
- **Notifications and subscriptions.** Push notifications and forecast emails are a separate effort and are not a dependency of anything here.
- **Shared code libraries across repositories.** Worth doing eventually; not a prerequisite for any of this.

## Open questions

Genuinely undecided, listed so they get decided deliberately rather than by default.

### 1. Do the legacy widgets get converted to the new API?

Not part of this project as currently scoped. But the widgets stay in service for every center not on AvyWeb, so somebody converts them eventually. Whether that becomes this project's problem later is open — flagged now because the answer determines how long two implementations have to coexist.

### 2. What happens to the media gallery?

AvyWeb already has its own native gallery — a media collection with a grid, lightbox and zoomable images. It is better integrated than the AFP media widget, so for galleries an editor places on a page, the widget looks redundant.

The complication is forecasts. Forecasts are written in the AFP dashboard, so media attached to a forecast arrives with the forecast and cannot come from AvyWeb's gallery. So either the media gallery gets rebuilt natively for forecasts specifically, or forecast media is handled as part of the forecast page and the standalone widget is retired in favor of AvyWeb galleries everywhere else.

Leaning toward retiring it. Needs a decision.

### 3. One legacy quirk to confirm before dropping

The widgets contain a special case for one center's weather data on forecasts published before May 2020. Reproducing it is cheap but only matters for archived forecasts of that vintage. Confirm whether anyone needs those to render correctly.

## What this enables

The finish line above is parity, which by design changes nothing a reader would notice. The reason to get there is everything it makes possible afterward. These are ideas rather than commitments — none is scoped or scheduled — but they are the payoff, and they are why parity is worth doing carefully rather than quickly.

**Design we control.** How a forecast is presented becomes a design decision rather than a constraint inherited from someone else's bundle. Every question the team has had to shelve — ordering, density, what a reader sees first on a phone — becomes answerable.

**Real experiments.** Serve two versions of a forecast layout, measure which one readers actually use, keep the winner. Today we can only argue about it. This is the clearest case where owning the pages converts an opinion into evidence, and it is the direct reason the layout variant machinery is on the list above.

**Reader-chosen layouts.** AvyWeb is planning public accounts ("Members"), and one idea already recorded there is letting a reader pick the forecast layout they prefer — a professional and a first-time backcountry traveler do not want the same page. Worth noting the mechanism is identical to A/B testing: a cookie selects a layout, and the page comes from a matching pre-generated route. The only difference is what sets the cookie — a random assignment for an experiment, a saved preference for a member. Building one gets most of the other, which is a good reason to build the machinery once and well.

**New combinations of products.** The combined map view is the first of these. It is a presentation change rather than a data project — which is the entire point of building the foundation this way.

## Reference material

For anyone who wants the detail behind this document.

- [**Parity ledger**](parity-ledger.md) — the row-by-row inventory of every legacy widget behavior and whether the native replacement covers it, including the deliberate departures. The artifact that makes the finish line checkable.
- [**Architecture decisions**](../decisions/README.md) — the reasoning behind the data layer, the rollout controls and the freshness mechanism, recorded as ADRs alongside the platform's other architectural decisions.
- **Functional reference** — a description of how the legacy widgets actually behave. Maintained alongside the widget code in the `afp-public-widgets` repository and shared with the AFP team, so it stays accurate as the widgets change.
- **GitHub issues** — the [work breakdown](#work-breakdown) items, where day-to-day status lives.
