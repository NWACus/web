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
The avalanche forecasting platform — a sibling system in the NAC software-consolidation effort, distinct from this web/CMS app.

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

**HomePage**:
The single homepage document for a Tenant — a tenant-scoped global.

**Navigation**:
The single site navigation for a Tenant — a tenant-scoped global, assembled from BuiltInPage and Page references.

**Settings**:
The single site-configuration document for a Tenant — a tenant-scoped global.

**Tag**:
A label that categorizes Posts (tenant-scoped). Distinct from EventTag despite the name: Tags are for Posts, EventTags are for Events.
_Avoid_: EventTag (different entity)
