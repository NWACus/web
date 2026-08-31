# AvyWeb

The multi-tenant web platform that serves public websites and content management for multiple avalanche centers from a single codebase. This glossary defines the domain language used across the app.

## Tenancy

**Avalanche Center**:
A real-world organization (e.g. NWAC, SAC, DVAC, SNFAC) that publishes avalanche forecasts and content and gets its own website. The canonical domain term; "Center" is an acceptable short form. Use it in anything user-facing.
_Also called_: Center, AC (short forms)

**Tenant**:
The same entity as an Avalanche Center, named for its multi-tenancy/RBAC role — the isolation boundary that scopes content, roles, subdomains, and URL paths. Use it when talking about data scoping, access control, or request routing, not in user-facing copy.

## People

**User**:
An authenticated account that can sign into the admin; the subject of RBAC. Identified by email. Distinct from a Biography — a User is a login, not a public identity. (No data relationship currently links a User to a Biography.)

**Biography**:
A public profile of an avalanche center staff member or contributor (name, headshot, title, bio). Tenant-scoped and independent of any User account — a person can have a Biography without a login, and vice versa. Can be grouped into Teams and credited as the Author of a Post.
_Avoid_: Staff member (as a data term — "Staff" is only an admin UI grouping)

**Author**:
A Biography in its role as the credited writer of a Post. Not a separate entity.

**Team**:
A named, ordered grouping of Biographies for display (e.g. a "Who We Are" page). Not an org unit and not a permissions group.

## Access & Roles

The "user types" below are **facets of a single User**, determined by what assignments and relationships that User holds. One User can hold several facets at once.

**Role**:
A named, reusable set of permission rules (collections × actions) — a permission template. Scoped to a Tenant when assigned.

**Role Assignment**:
Binds a User to a Role within a specific Tenant. The tenant-scoped grant.

**Global Role**:
A Role-shaped permission set that applies across all Tenants rather than one.

**Global Role Assignment**:
Binds a User to a Global Role. Not tenant-scoped.

**Tenant Role User**:
A User with one or more Role Assignments; permissions scoped to specific Tenants.

**Global Role User**:
A User with one or more Global Role Assignments; permissions span all Tenants.

**Super Admin**:
A Global Role User whose Global Role grants every action on every collection (a wildcard rule, or rules covering everything). The highest permission level, not a distinct entity.

**Provider User**:
A User linked to one or more Providers via a `providers` relationship; can manage their own Provider(s) and those providers' Courses.

**Provider Manager**:
A User holding the specific Global Role designated in the A3Management global as the provider-manager role. Oversees _all_ Providers and Courses — the A3-level administrator above individual Provider Users.

## Organizations & Programs

**A3 (American Avalanche Association)**:
The body that accredits avalanche education. In the app, the A3Management global designates which Global Role is the Provider Manager role, and Providers are the course providers operating under A3's program.

**NAC (National Avalanche Center)**:
The USFS National Avalanche Center. The NACWidgetsConfig global configures embeddable "NAC widgets" used on center sites.

**AFP (Avalanche Forecast Platform)**:
The avalanche forecasting platform — a sibling system in the NAC software-consolidation effort, distinct from this web/CMS app. AvyWeb reads its product data directly; see Native Product Pages.

## Avalanche Education

This cluster is **national/shared** — it lives outside per-Tenant isolation. One Provider's Courses form a single nationwide catalog, surfaced across the platform rather than owned by any one Avalanche Center.

**Provider**:
An organization that offers avalanche education courses under A3 accreditation. National/shared — not tenant-scoped — though an Avalanche Center that runs courses may have its own Provider record. Managed by its Provider Users and overseen by Provider Managers.
_Also called_: Course Provider

**Course**:
An avalanche education class offered by a Provider — type (Rec 1/2, Pro 1/2, Rescue, Awareness), dates, location, interest groups, and mode of travel. National/shared and intended to surface on Avalanche Center sites (e.g. via blocks). A distinct entity from an Event.
_Also called_: A3 course
_Avoid_: Event (a Course is not an Event, despite some legacy "event" wording in the Courses config)

## Events

Tenant-scoped — each Event belongs to one Avalanche Center. Distinct from a Course.

**Event**:
A single scheduled happening run by an Avalanche Center (e.g. a class, talk, or fundraiser). Carries an intrinsic Event Type plus optional EventGroups and EventTags.
_Avoid_: Course (a center's Event is not an A3 Course)

**Event Type**:
A fixed enum describing the intrinsic _kind_ of an Event (`Event`, `Awareness Class`, `Field Class`). Distinct from EventGroups/EventTags — it is the event's nature, not a grouping. (Originally meant as a standardized cross-center taxonomy; centers wanted flexibility, so free-form grouping moved to EventGroups/EventTags.)

**EventGroup**:
A curated, named series or collection of Events with its own page (slugged), e.g. "Avalanche Awareness Week." A grouping you link to.

**EventTag**:
A lightweight, slugged filter label for browsing Events. Categorizes for filtering; not a destination page.

## Forecast Glossary

This cluster is **national/shared** — standard avalanche vocabulary, not center-specific, so it lives outside per-Tenant isolation (like the Avalanche Education cluster).

**Glossary Term**:
A standard avalanche-vocabulary entry — the word(s) it matches, a short plain-language definition, and an avalanche.org encyclopedia link. National/shared (one set across all Avalanche Centers), not tenant-scoped. Surfaced as a tooltip when its word appears in forecast prose. Replaces the legacy widget's hardcoded term list (sourced from the avalanche.org encyclopedia, which has no API).

**Glossary tooltip**:
The rendered hover affordance on a forecast page — a Glossary Term's word marked up in the forecast prose, showing its definition and linking to avalanche.org. Surfaced on every native forecast whenever the national Glossary Terms set is non-empty (no per-Tenant toggle — the vocabulary is universal). Applied client-side over the server-rendered prose, so it never enters the forecast page cache.

## Content & Site Configuration

**Tenant-scoped global**:
A collection constrained to exactly one document per Tenant (via `tenantField({ unique: true })`), so it reads like a singleton "global" from each Avalanche Center's point of view. Contrast with a true Payload Global (one app-wide instance, e.g. A3Management, NACWidgetsConfig, Diagnostics). HomePage, Navigation, and Settings are tenant-scoped globals.

**Page**:
A free-form, tenant-scoped CMS page an editor composes from blocks. The ordinary editable page.

**BuiltInPage**:
A special, system-managed page reference (title + relative link) — not free-form content. Editable only by super admins, selectable in link blocks, and the backbone of Navigation. A `source` enum (`afp_zone | nac_platform | static`) marks whether a reconciler or an admin owns each row; a reconciler keeps the `afp_zone`/`nac_platform` rows aligned with upstream AFP and NAC.
_Avoid_: Page (a BuiltInPage is not an editable Page)

**Forecast Zone**:
A geographic avalanche-forecast area owned by AFP (matched by `afp_zone_id`). Each surfaces on a center site as a `source: 'afp_zone'` BuiltInPage.

**NAC widget**:
An embeddable public widget from the `afp-public-widgets` repo (e.g. forecast/weather/observation widgets), rendered on Avalanche Center sites and configured by the NACWidgetsConfig global. Typically housed on BuiltInPages.
_Contrast_: Native product page (the AvyWeb-rendered replacement, chosen per Tenant per Product by the Rollout flag)

**HomePage**:
The single homepage document for a Tenant — a tenant-scoped global.

**Navigation**:
The single site navigation for a Tenant — a tenant-scoped global, assembled from BuiltInPage and Page references.

**Settings**:
The single site-configuration document for a Tenant — a tenant-scoped global.

**Tag**:
A label that categorizes Posts (tenant-scoped). Distinct from EventTag despite the name: Tags are for Posts, EventTags are for Events.
_Avoid_: EventTag (different entity)

## Native Product Pages

AvyWeb rendering NAC/AFP product data itself, on its own design system, instead of embedding a NAC widget. This cluster is **not tenant-owned data** — the products come from upstream APIs; what is tenant-scoped is only the decision to render them natively. See [architecture.md](docs/afp-products/architecture.md) for how the layers fit together and [ADR 018](docs/decisions/018-native-product-page-architecture.md) for why.

**Native product page**:
An AvyWeb-rendered page that displays a NAC/AFP Product — forecast, warning, danger map, weather, observations — natively, replacing the embedded NAC widget for that Product. Chosen per Tenant and per Product, so a center can run a native forecast while its observations stay on the widget.
_Contrast_: NAC widget (the legacy embedded widget a native page replaces)

**Product** (data-layer sense):
A unit of NAC/AFP product data — a Source adapter plus a Normalized model. Forecast, warning, weather, danger map layer, observation, weather station. Aligns with the NAC API's own product types. A Product is data; a View is what shows it.
_Avoid_: "product" as a loose synonym for a page or a feature — a Product is the data unit a View composes.

**View**:
A composition of one or more Products into a page or layout. The 1:1 widget replacement is one View per Product; a combined map View consumes several. Distinct from a Product — a Product is data, a View is presentation. The data layer is deliberately view-agnostic, so a new layout is a new consumer of existing models, not a data rewrite.

**Source adapter**:
The per-Product module that reads one backend and maps it into the Normalized model (`src/services/nac/sources/`) — one interface per Product, one implementation per Data source. Pages resolve one through `getForecastSource(center)` and never import an implementation directly. The mapping functions are the unit-tested seam where v2/v3 equivalence gets proven.

**Normalized model**:
The API-agnostic representation of a Product that presentation components consume (`src/services/nac/model/`). No component ever sees a raw AFP response — that is what lets a Product's Data source change without touching presentation.

**Data source**:
The backend a Product is fetched from — legacy **v2** (`avalanche.org-API`), the AFP's **v3** `products-api`, SnowObs (weather stations), or the `observation-api`. Selected in code and env per Product, uniform across Tenants, with an optional per-center canary allowlist. Deliberately not a center-admin Setting: it keeps the test matrix to one dimension and stops an administrator pointing a live safety page at an unverified backend.
_Note_: "v3" names the AFP's new **platform generation**, not a URL segment or an API version shared across products — observations live at `/obs/v1`, not a `/v3` path. Saying a Product is "on v3" says which backend answers for that Product and nothing about any other.

**Rollout flag**:
The per-Tenant × per-Product `nativeProducts` checkbox in Settings that decides native page versus NAC widget. Defaults to off, so merging native code ships capability rather than behavior — nothing reaches readers until a center turns it on, and unchecking reverts without a deploy. Center-admin-facing, and distinct from Data source: rollout is a content decision, data source is an engineering one.

**Capability flag** (`platforms.*`):
A per-center boolean from the NAC capability feed — `forecasts`, `warnings`, `stations`, `obs`, `weather` — declaring whether a center _has_ that product at all. Read-only to AvyWeb and evaluated **above** the Rollout flag: no capability, no page, whatever Settings says.
_Note_: NWAC's `weather` is `false` — NWAC authors mountain weather in its own system rather than in AFP.

**Mountain Weather Forecast (MWF)**:
NWAC's in-house mountain weather product, migrating out of a legacy app into the AFP's `products-api`. Served exclusively by dedicated `/mwf/*` endpoints, so unlike every other Product it has no legacy v2 equivalent to fall back to — "default to v2" is a per-Product default, not an invariant. Not consumed by AvyWeb yet.
_Contrast_: the traditional weather product, which other centers author in AFP and which a forecast points at via `weather_data.weather_product_id`. MWF has no such pointer — its morning and afternoon forecasts derive from center plus service date.
_Note_: MWF stores an object-shaped variant envelope in `weather_data` that v3 excludes from generic product reads but legacy v2 does not, so weather shape detection must degrade rather than throw.
