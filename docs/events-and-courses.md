# Events & Courses

The Events system allows avalanche centers to create and manage events such as classes, workshops, and community events. Events can be displayed on tenant websites and embedded in pages using blocks.

Events and Courses are very similar but Courses are for A3-accredited courses and for use by external providers.

## Events

### Collections

#### Events
Slug: `events`

Main collection for all events. Tenant-scoped with draft/publish workflow.

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
- Respects `navigation.events.enabled` setting

### Event Detail
**Path:** `/{center}/events/{slug}`

Individual event page showing:
- Event metadata (date, location, cost, capacity, skill level)
- Registration button with deadline awareness
- Rich text content
- Redirects to `externalEventUrl` if set

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
| `limit` | number | Results per page |
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
- Provider relationship

#### Providers
**Slug:** `providers`

Avalanche education organizations that can create and manage courses.

Key fields:
- Name and details
- Contact information (email, phone, website)
- Business location
- States serviced (for filtering by region)
- Approved course types (controls which course types they can create)
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
