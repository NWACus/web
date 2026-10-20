# Events & Courses

The Events system allows avalanche centers to create and manage events such as classes, workshops, and community events. Events can be displayed on tenant websites and embedded in pages using blocks.

Events and Courses are very similar but Courses are for A3-accredited courses and for use by external providers.

## Events

### Collections

#### Events
Slug: `events`

Main collection for all events. Tenant-scoped with draft/publish workflow.

**Location coordinates.** In-person events store `location.coordinates.latitude` / `longitude` as two indexed number columns, not Payload's `point` field: the SQLite adapter can't query `point`, but it can range-query numbers (see `src/utilities/geo/`). The events page uses two of them: `withinBoxWhere` (`src/utilities/geo/where.ts`) narrows a query to a lat/lng box for "Search this area", and `nearestFirst` (`src/utilities/geo/distance.ts`) sorts loaded events by distance for the Nearest sort. `findNear` (radius, nearest first), `findWithinBox` and `findWithinArea` (a GeoJSON polygon: the database narrows to its bounding box, then Turf's point-in-polygon test runs in JS) have no callers in the app yet; only the `geo:near-poc` script (`src/scripts/geo-near-poc.ts`) exercises `findNear`. `geocodeStatus` records where the point came from: `geocoded`, `approximate` (street, city or ZIP centroid), `manual` or `failed`.

- On save, the `location` group's `beforeChange` hook (`src/fields/location/hooks/geocodeLocation.ts`) geocodes the address with Geocodio (`GEOCODIO_API_KEY`) when the address changes, or when an event has never been placed. Coordinates the editor changed win over the address. A `manual` pin is only re-geocoded when the address changes. Saving an event as virtual clears its point and status, so switching it back to in person geocodes it afresh. If the key is unset or Geocodio is down, the save still goes through: a new event gets no point, and an edited address drops its old geocoded point (a `manual` pin stays) so the next save tries again.
- Geocodio results may be stored; Mapbox's default (temporary) geocoding and Search Box results may not, which is why Mapbox is only the map here.
- The admin's "Map location" picker (`src/fields/location/components/CoordinatesPicker.tsx`) shows the point on a map. Clicking or dragging the pin sets it as `manual`. "Find from address" calls `GET /api/events/geocode`, a proxy for signed-in admin users who can edit events (not MCP API keys) that keeps the key on the server. Trailheads and ski areas often have no street address, so the pin is the way to place them.

#### Event Groups
**Slug:** `eventGroups`

Tenant-scoped collection for organizing events into groups (e.g., "Meet Your Forecaster Series").

#### Event Tags
**Slug:** `eventTags`

Tenant-scoped collection for tagging events with attributes (e.g., "Women Only", "21+").

## Frontend Pages

### Events List
**Path:** `/{center}/events`

Main events listing page with:
- Filtering by event type, date range, groups, tags
- Quick date filters (this week, next week, this month, etc.)
- Sorting by start date or registration deadline
- Pagination support
- A List/Map toggle (`?view=map`). The map view fetches every event matching the filters (up to 200, with a notice when more match) and shows them in a compact list beside a map. Each card has compact Register/Learn More buttons (`EventActions`, shared with the list view's `EventPreview`) and a Details toggle that expands the subtitle, description, full dates and skill level. On wide screens the page scrolls the list while the List/Map buttons and the map stay pinned. On phones the List/Map buttons drop their text for icons, leaving the sort button room for its place name, and the sort menu spans the screen. On phones (below `md`) the map view fills the screen under the site header instead (`PhoneMapView`, after Airbnb's mobile web): floating List, Filters and sort buttons along the top (Filters opens the page's drawer through `MobileFiltersDrawerContext`), and the same list scrolling up over the map from 60% down, with a "Map" button to scroll back once it covers the map. The map pans with one finger there, since there's no page scroll to share gestures with, and its zoom buttons, logo and attribution sit just above the list. A pin opens a card of its place's events docked at the bottom in place of the popup, and "Show on map" opens the same card and moves focus into it. Switching views and opening a card each add a history entry, so Back closes the card, then the map. Research behind the layout: the throwaway branch `busbyk/events-mobile-map-prototype` holds the variants it was picked from. The filters sidebar stays pinned in the list view, with its first heading centered on the List/Map buttons. In the wide map view (`xl` and up) the sidebar steps aside so the map gets its width: the same filters become dropdown buttons in the sticky bar beside the sort button (`EventsFilterBar.tsx`). Each button shows what's in effect (the date range's name, or a count of checked options) and its menu has a Clear; the date menu closes on a pick, the checkbox menus stay open for several. There's no row of applied-filter chips: the buttons already say what's applied, and a second row would change the bar's height under a pinned map. A shadow appears under the bar, over the list only, once cards have scrolled beneath it. The bar sticks within a track that ends one map height above the results' end, so at the bottom of the page the bar and map scroll away together instead of the map sliding under the bar. The throwaway branch `busbyk/events-desktop-map-prototype` holds the layouts this was picked from. Events at the same point share one pin, and zoomed out, pins that would overlap merge into a cluster showing their event count (`clusters.ts`, using `supercluster`); clicking one zooms in until it splits. The selected place always keeps its own pin so its popup can open. Clicking a pin highlights its events in the list; "Show on map" flies to the pin. The list is the accessible equivalent of the map: pins stay hidden from screen readers, each card's buttons name their event, a status region announces the event count after filtering or searching an area, and Escape closes a popup. Virtual and unplaced events are listed under "Not on the map". Panning or zooming the map (not a window resize, which Mapbox reports the same way) offers "Search this area", which narrows the events to the visible area via a `bbox=west,south,east,north` param (`src/utilities/geo/boxParam.ts`) that the events API passes to `getEvents` as a box filter (virtual events are always left out); the map holds that view instead of refitting to the results, and switching back to the list clears it. Components live in `src/components/EventsMap/`.
- A Soonest/Nearest sort beside the List/Map buttons (`EventsSort`). Nearest sorts every matching event by straight-line distance, shown on each card as "~35 mi away", with virtual and unplaced events last under "Online & no location". There's no radius: the events are few enough that sorting serves better than cutting off. `getEvents` loads every matching event's location, sorts them in JS (SQLite can't sort by distance), then fully loads only the page shown. The origin is either a place typed into a Mapbox Search Box combobox (`PlaceSearch`; Mapbox bills per search session, and the results are only used to sort, never stored), written to the URL as `near=lat,lng&nearLabel=…` and sorted on the server, or "Use my location". The device location is asked for only on that click, rounded to about 1 km and kept in `sessionStorage`, or in memory until reload where storage is off (`deviceLocation.ts`); the URL only says `near=me`, so shared links and history never carry it. Once it's read, the list and map refetch from the events API with that rounded point as `near`. The sort button's icon and the open menu show which origin is in use: the place box holds the typed place, or "Using your location" is checked. The map marks the origin with a dot. The sort carries across List/Map; it composes with "Search this area", which filters.
- Respects `navigation.events.enabled` setting

### Event Detail
**Path:** `/{center}/events/{slug}`

Individual event page showing:
- Event metadata (date, location, cost, capacity, skill level)
- Registration button with deadline awareness
- Rich text content
- Redirects to `externalEventUrl` if set

### Dates and Timezones

Event times render in the event's own timezone (`startDate_tz`, defaulted to the center's) with the zone abbreviation, e.g. `Sep 28, 2026, 11:00 AM - 1:00 PM PDT`. They go through `ZonedDateTime` (`src/components/ZonedDateTime.tsx`), which follows the time with the viewer's local equivalent in parentheses when their browser is in a zone that disagrees, e.g. `1:00 PM PDT (2:00 PM MDT)`. A multi-day range gets one parenthetical beside each day's time, e.g. `Oct 19, 5:00 PM (6:00 PM MDT) - Oct 20, 2026, 1:00 PM PDT (2:00 PM MDT)`. A parenthetical adds a date only where the viewer's clock lands on a different day than the reader would assume from the event text. It is added after hydration, so server markup never depends on the viewer's timezone, and it fades in unless the viewer has asked for reduced motion (`prefers-reduced-motion`). Because it is plain text rather than a button or popover, it is safe inside links and clickable rows.

Course listings show **dates only**, e.g. `Jan 6 - Jan 8, 2026` or `Jan 6, 2026` for a single day, because courses usually have several sessions at different times. `CoursePreviewSmallRow` passes `showTime={false}` to `StartAndEndDateDisplay`, which formats with `formatDateRange` (`src/utilities/formatDateTime.ts`). The course's timezone still decides which calendar day each instant lands on; the stored start and end keep their times.

## Blocks

### SingleEvent Block
Display a single featured event anywhere on a page.

**Configuration:**
- Event selection (tenant-filtered)
- Background color

### EventList Block
Display multiple events in a list/grid format.

**Modes:**
- **Dynamic:** Auto-populate with filters (type, date range, max count, sort order)
- **Static:** Manually select specific events

**Configuration:**
- Heading and description
- Background color
- "View all" link to events page

### EventTable Block
Display events in a tabular format with columns for date, title, location, etc. Very similar to EventList but with a different UI.

## API

### Events API
**Endpoint:** `GET /api/{center}/events`

Returns paginated events for a tenant. Used by the EventsList page and EventList and EventTable blocks when mode=dynamic.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `offset` | number | Pagination offset |
| `limit` | number | Results per page (at most 200) |
| `types` | string | Comma-separated event types |
| `startDate` | string | Filter start date (ISO format) |
| `endDate` | string | Filter end date (ISO format) |
| `groups` | string | Comma-separated event group IDs |
| `tags` | string | Comma-separated event tag IDs |
| `modesOfTravel` | string | Comma-separated travel modes |

**Response:**
```json
{
  "events": [...],
  "hasMore": boolean,
  "total": number
}
```

## Event Types

| Value | Label | Description |
|-------|-------|-------------|
| `event` | Event | General community events |
| `awareness` | Awareness Class | Introductory avalanche awareness sessions |
| `field-class` | Field Class | Hands-on field-based instruction |

These event types might change in the future based on avalanche center usage.

## Courses

Courses are A3-accredited avalanche education classes managed by external education providers. Unlike Events (which are tenant-scoped), Courses are global and managed by Providers who create and maintain their own course listings.

For avalanche centers that are also course providers, we will create a matching provider for that avalanche center and associate users to that provider as needed. The avalanche center will use the embeds like providers do.

### Collections

#### Courses
**Slug:** `courses`

Individual course instances with dates, location, and registration details. Each course is linked to a Provider.

Key fields:
- Title, subtitle, description
- Start/end dates with timezone support
- Location (place name, address, city, state, zip)
- Course URL (external registration link)
- Registration deadline
- Course type (see below)
- Mode of travel, affinity groups
- Provider relationship (required to publish)

Course slugs must be unique across every provider, since courses have no tenant. Left blank, the slug auto-generates as `{provider-slug}-{title}-{YYYY-MM-DD}`, and a collision (generated or typed) gets a `-2`, `-3`, … suffix instead of an error. Nothing public reads the slug today; courses link out to `courseUrl`.

#### Providers
**Slug:** `providers`

Avalanche education organizations that can create and manage courses.

Key fields:
- Name and details
- Contact information (email, phone, website)
- Business location
- States serviced (for filtering by region)
- Approved course types (controls which course types they can create)
- Curriculum (optional, multi-select: AIARE, AAI, SAS, MTC, Provider Developed; editable only by provider managers and super admins)
- Notification email

### Course Types

| Value | Label | Description |
|-------|-------|-------------|
| `rec-1` | Rec 1 | Recreational Level 1: Introduction to avalanche safety |
| `rec-2` | Rec 2 | Recreational Level 2: Advanced recreational course |
| `pro-1` | Pro 1 | Professional Level 1: Entry-level professional training |
| `pro-2` | Pro 2 | Professional Level 2: Advanced professional course |
| `rescue` | Rescue | Avalanche rescue courses |
| `awareness-external` | Awareness | Introductory avalanche awareness sessions |

### API

#### Courses API
**Endpoint:** `GET /api/courses`

Returns paginated courses with filtering support.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `offset` | number | Pagination offset |
| `limit` | number | Results per page |
| `types` | string | Comma-separated course types |
| `providers` | string | Comma-separated provider slugs |
| `states` | string | Comma-separated state codes |
| `affinityGroups` | string | Comma-separated affinity groups |
| `modesOfTravel` | string | Comma-separated travel modes |
| `startDate` | string | Filter start date (ISO format) |
| `endDate` | string | Filter end date (ISO format) |

### Access Control

Courses use a provider-based access model:
- Users with a `providers` relationship can only access their own provider's courses
- Provider managers can manage courses for their assigned providers
  - Provider managers are indicated by the role selected in the A3Management global
- Global roles (e.g., super admin) have full access

### Frontend Display

Courses are primarily displayed through embeddable widgets designed for external sites (like the A3 website). See the [A3 Embeds documentation](./a3-embeds.md) for details on:
- `/embeds/providers` - Provider directory by state
- `/embeds/courses` - Filterable course listing

There is an embed generator at `/admin/embed-generator`.

## Related Documentation

- [A3 Embeds](./a3-embeds.md) - For external course provider embeds
