# Events

## Functionality

## Code

**Collections**

- Event Types
- Event Sub Types
- Event Groups (tenant-scoped)
- Events (optional tenant since could be A3)
- External Providers (should this be broader to include other external users)

**Pages**

- **Events List** (`/src/app/(frontend)/[center]/events/page.tsx`)
  - Main events listing page with filtering and sorting
  - Filters: event type, event sub type, upcoming/past events
  - Sorting: by start date or registration deadline
  - Pagination support
  - Respects navigation.events.enabled flag

- **Event Detail** (`/src/app/(frontend)/[center]/events/[slug]/page.tsx`)
  - Individual event page with full details
  - Static generation with generateStaticParams
  - Displays event metadata (date, location, cost, capacity, skill level)
  - Registration button with deadline awareness
  - Handles externalEventUrl redirects
  - Rich text content display

- **Paginated Events List** (`/src/app/(frontend)/[center]/events/page/[pageNumber]/page.tsx`)
  - Pagination support for events listing
  - Maintains filters and sorting across pages

**Blocks**

- **SingleEvent** (`/src/blocks/SingleEvent/`)
  - Display a single featured event
  - Configuration: background color, event relationship (tenant-filtered)
  - Two variants: `SingleEventBlock` (standard) and `SingleEventBlockLexical` (with wrapInContainer option)
  - Component renders EventPreview

- **EventList** (`/src/blocks/EventList/`)
  - Display multiple events in a grid/list
  - **Dynamic mode**: Auto-populate events with filters
    - Sort by: start date, registration deadline (ascending/descending)
    - Filter by: event types, event sub types
    - Show upcoming only toggle
    - Max events (1-20)
    - QueriedEventsComponent for real-time preview
  - **Static mode**: Manually select specific events
  - Configuration: heading, below-heading content (rich text), background color
  - Two variants: `EventListBlock` and `EventListBlockLexical` (with wrapInContainer)
  - Component renders EventPreviewSmallRow for each event
  - "View all" link to events page with filters applied

**Components**

- **EventMetadata** (`/src/components/EventMetadata/`)
  - Reusable component for displaying event details
  - Shows: date/time (with timezone), location (virtual or physical), cost, capacity, skill level
  - Icon-based layout using lucide-react icons
  - Virtual event badge
  - Configurable with showLabels prop

- **EventPreview** (`/src/components/EventPreview/`)
  - Full event card component for list views
  - Displays: image, title, subtitle, description, metadata
  - Shows status badges (past event, registration closed)
  - Handles external event URLs (opens in new tab)
  - Responsive layout with container queries
  - Call-to-action button (conditional based on event status)

- **EventPreviewSmallRow** (`/src/components/EventPreviewSmallRow.tsx`)
  - Compact horizontal event card for use in blocks
  - Shows: thumbnail, title, date, badges (virtual, past event)
  - Handles external event URLs

- **EventCollection** (`/src/components/EventCollection/`)
  - Container component for rendering multiple EventPreview components
  - Empty state handling

- **EventsSort** (`/src/app/(frontend)/[center]/events/events-sort.tsx`)
  - Client-side sort dropdown
  - Options: earliest/latest first (by start date or registration deadline)
  - Updates URL search params

- **EventsFilters** (`/src/app/(frontend)/[center]/events/events-filters.tsx`)
  - Client-side filtering UI
  - Upcoming events toggle (switch)
  - Event type checkboxes
  - Event sub type checkboxes
  - Updates URL search params

### A3 Things

- Maybe a global to manage A3 workflow (i.e. which users should get notifications and have approval permissions)
- Event listings can be embedded on third-party sites
- A dedicated non-tenant-scoped course listing page
- External course providers can submit courses for approval by A3 manager

### AC Things

- Maybe a global to manage which events will show up on their site
- Can create custom event groups for their center
- Each event has at least one event instance but could have many
- If you’re only a tenant-scoped role you would not see the internal/external field - it would default to internal. If you have a global role too you would see this field and could change to external. If internal, validation will require a tenant to be selected.

### Notes from Events discussion with team + Duncan

- CRM (Salesforce) is source of truth but AC can use events without a CRM (Salesforce) integration
- Will tie Events → Salesforce using salesforceId
    - Salesforce hierarchy will be represented by Event Type and Event Sub Type collections + internal/external attribute on Event collection
    - (future) If there is a salesforceId on an Event, only AvyWeb-specific fields will be editable (i.e. content fields, external provider potentially if that’s not included in Salesforce, other fields not managed by Salesforce)
- Events will have a relationship to an external provider (if they are external)
- Event Groups will be used to represent a flexible next level of hierarchy for centers. This could be used for things like event series’ like a “Meet your forecaster” event type/style. This should be able to be represented in Salesforce using the campaigns hierarchy.

## Questions / technical things to figure out

- Course approval workflow
    - A form for event submission
    - Access only by external providers - how? External logins using Payload or is an access code or something similar sufficient?
- A3 global roles
    - Integration with the approval workflow
    - Can only create events for external providers but shouldn’t be able to create events for ACs. Maybe tricky since we plan to use the same collection
- How do ACs include external provider courses on their site? Might be as simple as a `tenants` array on external type events. Or could use a global to store specific external events or event providers…
- Embeds
    - Listings
    - Single events?
    - Embed code retrieval - just logged in users?
- Do we need external logins for external course providers?
- Event instances / date input format
    - How do we model events with multiple dates?
- Location data to include — a mapbox or google places api integration?
- CRM integration should be configurable probably. A3 might not use salesforce. It’s fine to require that ACs use the same Salesforce architecture. But A3 will likely be different. So might need multiple id fields or a crmIntegration enum (i.e. crmId, crmIntegration (avalanche-center-salesforce or a3-crm).
- Timezones
    - We know each avalanche center’s timezone but we don’t know external providers or A3 users’ timezones. Should probably accept as a dropdown.
    - Should make sure we save the event to the db with the correct timezone and then just depend on the ISO string to render correctly on the client. Although hmm static rendering… maybe it just makes sense to render dates using the event’s timezone then. Could use client components to render the user’s local timezone after hydration I suppose. Flash of different content though.
- Can we use masks for Payload fields for formatting (i.e. formatting as currency)

## Ideas

- A calendar feed users can add to their personal calendars
- Add to calendar button for individual events (maybe only after signup)
- Map-based events view

## TODOs

- [x] Initial, simple implementation
- [ ] Add modeOfTravel field to events
- [ ] Add Event Groups or Event Tags i.e. another thing to group events by (this would represent an event series like multiple meet your forecasters or an attribute of an event like it being 21+ or Women Only/Women Taught or some other generic grouping like that)
- [ ] Handle internal vs. external events (i.e. external events have a relationship to a Course Provider / External Course Provider / Provider). Will need to decide on name for collection representing Providers.
- [ ] Handle global role setup for A3 event manager type users who can perform all actions on external events but they shouldn't be able to manage internal events associated with an avalanche center.
- [ ] POC for a publishing workflow for providers to submit events and then have them approved (and the providers still need to be able to manage them after the fact -- potentially a v2 but good to consider now)
- [ ] POC for event instances / events with multiple dates
- [ ] POC for location data that can be displayed on a map and used to filter results
- [ ] Simple embed of EventCollection with specific filters for third-parties to use on their websites
- [ ] Ensure revalidation is implemented for all new collections. See `/docs/revalidation.md`
- [ ] Ensure migrations have been created
- [ ] POC for allowing ACs to control which events appear on their website. Probably a global collection that allows them to specify other avalanche centers and external courses (filtered by provider and/or location) that should show up on their website.

