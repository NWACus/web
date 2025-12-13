# Events

The Events system allows avalanche centers to create and manage events such as classes, workshops, and community events. Events can be displayed on tenant websites and embedded in pages using blocks.

## Collections

### Events
**Slug:** `events`

Main collection for all events. Tenant-scoped with draft/publish workflow.

**Key Fields:**
- `title`, `subtitle`, `description` - Event information
- `startDate`, `endDate` - Date range with timezone support
- `location` - Physical address or virtual event flag
- `type` - Event type: Event, Awareness Class, or Field Class
- `registrationUrl` - External registration link
- `externalEventUrl` - Optional external landing page (bypasses internal event page)
- `registrationDeadline` - Registration cutoff date
- `skillLevel` - Beginner, Intermediate, Advanced, or All Levels
- `modeOfTravel` - Ski, Splitboard, Motorized, Snowshoe
- `eventGroups`, `eventTags` - Categorization relationships
- `featuredImage`, `thumbnailImage` - Event imagery
- `content` - Rich text landing page content with block support

### Event Groups
**Slug:** `eventGroups`

Tenant-scoped collection for organizing events into groups (e.g., "Meet Your Forecaster Series").

### Event Tags
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
Display events in a tabular format with columns for date, title, location, etc.

## API

### Events API
**Endpoint:** `GET /api/{center}/events`

Returns paginated events for a tenant.

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

## Related Documentation

- [A3 Embeds](./a3-embeds.md) - For external course provider embeds (separate from tenant events)
