## Events functionality

I'm building events features out for AvyWeb (this codebase). We're going to keep it very flexible and simple to start with. There will be two collections:
- Events
- Event Groups

An event can have many event groups associated with it and vice versa.

There will be an events listing page, a page for a given event group which will display events with that group, there will be a single event page.

We will have a block that displays a few events based on an event group filter.

An event will have an external registration link that redirects to a third-party platform for actually registering. An even could also have an external landing page which would take precedence over the single event page but this is an optional attribute. I.e. if an even has an external event landing page, the user would be redirected to that url when visiting the single event page.

When events are rendered as card components in other UI (like on the events listing page or event group page or events by group block) there will be two buttons:
1. Register (external registration link)
2. More info (either the event listing page or redirects to the external event landing page if the event has that set)

The events listing page should look similar to the blog/posts listing page and have similar pagination. TBD if we'll want to allow filtering by multiple event groups like we do on the blog listing page or if the event groups will be links to their group pages.

## Rough designs

There are some design ideas from Figma screenshots:
- docs/event-group-page-figma.png
- docs/events-listing-page-figma.png

## Additional considerations

Eventually (in another phase) we'd like to integrate with avalanche centers' CRMs which are all going to follow the same design. This doc: docs/Avalanche Center Event Management Assessment.pdf calls out some design considerations.

I'm wondering if it would make sense to expand our design in any way to accomodate future integrations with the CRMs.

I'm also wondering if including an Event Type collection and associated relationships would be helpful.

## Technical Implementation Plan

Based on codebase analysis, design review, and CRM integration requirements, here's a detailed implementation plan:

### Database Schema

#### Events Collection
```typescript
{
  tenant: relationship('tenants'),           // Multi-tenant support
  title: text(required),                     // Event name
  slug: slug,                                // URL-friendly identifier
  description: richText,                     // Full event description
  excerpt: text,                             // Short summary for cards
  featuredImage: upload('media'),            // Event image

  // Scheduling
  startDate: date(required),                 // Event start
  endDate: date,                             // Optional end date
  timezone: text,                            // Event timezone
  location: {
    venue: text,                             // Venue name
    address: text,                           // Full address
    coordinates: point,                      // Lat/lng for maps
    isVirtual: checkbox,                     // Virtual event flag
    virtualUrl: text                         // Meeting link
  },

  // Registration & Links
  registrationUrl: text,                     // External registration
  externalEventUrl: text,                    // Optional external landing
  registrationDeadline: date,                // Registration cutoff
  capacity: number,                          // Max attendees
  cost: number,                              // Event cost

  // Relationships
  eventGroups: relationship('event-groups', hasMany),
  eventType: relationship('event-types'),
  instructors: relationship('biographies', hasMany),

  // Admin
  _status: select(['draft', 'published']),
  publishedAt: date,

  // SEO & Metadata
  meta: seoFields
}
```

#### Event Groups Collection
```typescript
{
  tenant: relationship('tenants'),
  title: text(required),                     // e.g., "Avalanche Awareness"
  slug: slug,
  excerpt: text,                             // Short summary for cards and listings
  description: richText,                     // Rich text description for group page header
  content: blocks([                          // Custom page content using blocks
    Banner,
    Content,
    MediaBlock,
    EventsByGroup,                           // New block type for this group's events
    // ... other existing blocks
  ]),
  featuredImage: upload('media'),
  color: colorPicker,                        // For UI theming
  
  // Admin
  _status: select(['draft', 'published']),
  publishedAt: date,

  // SEO
  meta: seoFields
}
```

#### Event Types Collection (Recommended Addition)
```typescript
{
  tenant: relationship('tenants'),
  title: text(required),                     // e.g., "Course", "Workshop", "Outreach"
  slug: slug,
  description: text,
  icon: select(['course', 'workshop', 'awareness', 'fundraiser']),

  // CRM Integration fields (future)
  salesforceCampaignType: text,              // Maps to SF Campaign Type
  trackAttendance: checkbox,                 // Whether to track individual attendance
  generateRevenue: checkbox                  // Whether this type typically generates revenue
}
```

### Page Structure

#### 1. Events Listing Page (`/[center]/events`)
- Similar to blog listing with filters and pagination
- Filter by: Event Groups, Event Types, Date Range, Location Type
- Sort by: Date, Title, Recently Added
Future enhancements (document these somewhere for later):
- Search functionality
- Calendar view toggle option

#### 2. Event Group Page (`/[center]/events/groups/[slug]`)
- Group header with description and featured image
- Filtered events list showing only events in this group
- Same filtering/sorting as main events page
- Breadcrumb navigation

#### 3. Single Event Page (`/[center]/events/[slug]`)
- Redirects to externalEventUrl if set
- Full event details with rich content
- Register button (external link)
- Related events section
- Instructor profiles
- Event group tags
- Shows event type

#### 4. Events by Group Block
- Configurable block for other pages
- Shows N events from selected group(s)
- Card layout with Register + More Info buttons

### Components Architecture

#### EventCard Component
```typescript
interface EventCardProps {
  event: Event
  variant: 'horizontal' | 'vertical' | 'compact'
  showGroup?: boolean
  showType?: boolean
  showDate?: boolean
}
```

#### EventFilters Component
- Event Groups filter (checkbox list)
- Event Types filter (checkbox list)
- Date range picker
- Location type filter (In-person/Virtual/Both)
- Search input

#### EventRegistrationButton Component
- Handles external registration URL
- Tracks click analytics
- Supports disabled state for past events

### Implementation Phases

#### Phase 1: Core Collections & Admin
1. Create Events, Event Groups, Event Types collections
2. Set up admin interface with proper relationships
3. Add tenant filtering and access controls
4. Create seed data for testing

#### Phase 2: Frontend Pages
1. Events listing page with basic filtering
2. Single event page
3. Event group pages
4. Basic EventCard component

#### Phase 3: Enhanced Features
1. Advanced filtering and search
2. Calendar view (future enhancement - skip for now)
3. Events by Group block
4. Related events functionality

### Technical Considerations

#### Following Existing Patterns
- Use same tenant-based access control as Posts
- Follow same SEO field patterns
- Implement similar revalidation hooks
- Use consistent slug generation

#### Performance Optimizations (skip these for now, document for future enhancements)
- Index on tenant + date for fast queries
- Use pagination for large event lists
- Implement proper caching for event lists
- Optimize images for event cards

#### Future CRM Integration Readiness (skip these for now, document for future enhancements)
- Event Types map to Salesforce Campaign Types
- Support for tracking metrics (attendance, revenue)
- External ID fields for Salesforce sync
- Flexible custom fields for CRM data

### Revalidation Strategy

Following the existing patterns in the codebase, we need revalidation hooks for cache invalidation:

#### Events Collection Revalidation
- **After Create/Update/Delete**: Revalidate events listing page, related event group pages, and any pages with EventsByGroup blocks
- **Paths to revalidate**:
  - `/[center]/events` (main events listing)
  - `/[center]/events/groups/[group-slug]` (for each related event group)
  - Any pages containing EventsByGroup blocks referencing this event's groups
  - `/[center]/events/[event-slug]` (single event page)

#### Event Groups Collection Revalidation  
- **After Create/Update/Delete**: Revalidate the group page, events listing filters, and any pages with EventsByGroup blocks for this group
- **Paths to revalidate**:
  - `/[center]/events/groups/[group-slug]` (the group's custom page)
  - `/[center]/events` (events listing with updated filters)
  - Any pages containing EventsByGroup blocks referencing this group

#### Event Types Collection Revalidation
- **After Create/Update/Delete**: Revalidate events listing page (for filter updates) and any events using this type
- **Paths to revalidate**:
  - `/[center]/events` (events listing with updated filters)
  - All `/[center]/events/[event-slug]` pages for events using this type

#### Implementation Notes
- Use `revalidateTag()` for efficient bulk revalidation
- Tag events with: `events-${tenantSlug}`, `event-${eventId}`, `event-groups-${groupId}`
- Tag event groups with: `event-group-${groupId}`, `events-${tenantSlug}`
- Follow existing pattern from Posts collection in `src/collections/Posts/hooks/revalidatePost.ts`

---

## Future Enhancements

The following features were identified during planning but marked as "skip-for-now" to keep the initial implementation focused. These should be considered for future development phases:

### Calendar View
- **Description**: Alternative view for events listing page showing events in a calendar interface
- **Implementation**: Toggle between list view and calendar view, potentially using a library like FullCalendar or react-big-calendar
- **Files to modify**: `/src/app/(frontend)/[center]/events/page.tsx`
- **Benefits**: Better visualization of event timing and conflicts

### Advanced Search & Filtering
- **Description**: Enhanced search functionality with autocomplete, fuzzy matching, and saved filters
- **Features**:
  - Full-text search across event title, description, and instructor names
  - Search autocomplete with suggestions
  - Saved filter presets
  - Filter by instructor, price range, virtual vs in-person
  - Geolocation-based distance filtering
- **Implementation**: Consider using search services like Algolia or Elasticsearch for complex search
- **Files to modify**: `/src/app/(frontend)/[center]/events/page.tsx`, new search components

### Performance Optimizations
- **Database Indexing**: Add proper database indexes for common query patterns:
  - `tenant + startDate` for date-based filtering
  - `tenant + eventGroups` for group filtering
  - `tenant + _status + startDate` for published future events
- **Query Optimization**: Implement pagination with cursor-based pagination for large event lists
- **Caching Strategy**: 
  - Redis caching for frequently accessed event lists
  - Static generation for event group pages with ISR
- **Image Optimization**: Implement responsive images and WebP format for event cards

### CRM Integration (Salesforce)
- **Description**: Two-way sync with avalanche center CRM systems
- **Features**:
  - Sync event data to Salesforce Campaigns
  - Track registration conversions and attendance
  - Import existing campaign data
  - Revenue tracking and reporting
- **Database Changes**:
  - Add `salesforceId` field to Events collection
  - Add `salesforceCampaignId` field to Event Types
  - Add `syncedAt` timestamp fields
- **Implementation**: Background sync jobs, webhook endpoints for real-time updates

### Enhanced EventsByGroup Block
- **Description**: More configuration options for the events display block
- **Features**:
  - Multiple layout options (card grid, list, carousel, timeline)
  - Custom sorting options
  - Date range filtering
  - Maximum events limit configuration
  - Custom call-to-action text
- **Files to modify**: `/src/blocks/EventsByGroup/config.ts`, `/src/blocks/EventsByGroup/Component.tsx`

### Event Registration Tracking
- **Description**: Track registration click-throughs and conversions
- **Features**:
  - Analytics for registration button clicks
  - A/B testing for registration button text/styling
  - Integration with Google Analytics or similar
  - Registration conversion funnel tracking
- **Implementation**: Event tracking hooks, analytics service integration

### Multi-Language Support
- **Description**: Support for events in multiple languages
- **Features**:
  - Localized event titles and descriptions
  - Language-specific event filtering
  - Translated event group names
- **Implementation**: Leverage Payload's localization features, requires schema updates

### Event Series & Recurring Events
- **Description**: Support for recurring events and event series
- **Features**:
  - Create recurring event patterns (weekly, monthly, etc.)
  - Event series with shared metadata
  - Bulk management of recurring events
- **Database Changes**: Add `parentEvent` relationship, `recurrenceRule` field
- **Files to modify**: Events collection schema, admin interface customizations

### Wait Lists & Capacity Management
- **Description**: More sophisticated registration management
- **Features**:
  - Wait list when events reach capacity
  - Automatic notifications when spots open
  - Registration deadline enforcement
  - Cancellation management
- **Implementation**: Requires integration with registration platform APIs

### Event Reminders & Notifications
- **Description**: Automated reminder system for upcoming events
- **Features**:
  - Email reminders before events
  - Calendar integration (iCal exports)
  - Push notifications for mobile apps
- **Implementation**: Background job system, email service integration

### Advanced Event Filtering
- **Description**: More granular filtering options for events
- **Features**:
  - Filter by skill level (beginner, intermediate, advanced)
  - Filter by equipment requirements
  - Filter by weather dependency
  - Custom tag system for flexible categorization
- **Database Changes**: Add skill level, tags, and requirements fields to Events schema

### Event Review & Rating System
- **Description**: Allow participants to review and rate past events
- **Features**:
  - Star rating system
  - Written reviews
  - Instructor ratings
  - Review moderation
- **Database Changes**: New Reviews collection with relationships to Events and Users

### Geolocation Features
- **Description**: Location-based event discovery and mapping
- **Features**:
  - Interactive map view of events
  - Distance-based filtering
  - Driving directions integration
  - Weather integration for outdoor events
- **Implementation**: Google Maps or Mapbox integration, weather API

### Event Import/Export
- **Description**: Bulk event management tools
- **Features**:
  - CSV import for bulk event creation
  - Export events to external calendar systems
  - Integration with external event platforms
- **Implementation**: CSV parsing utilities, calendar format exports (iCal, Google Calendar)

### Mobile App Support
- **Description**: API endpoints and optimizations for mobile app consumption
- **Features**:
  - REST API for mobile app consumption
  - Push notification infrastructure
  - Offline event information caching
- **Implementation**: Dedicated API routes, mobile-optimized data structures

### Event Metrics & Analytics
- **Description**: Comprehensive analytics dashboard for event performance
- **Features**:
  - Event popularity metrics
  - Registration conversion rates
  - Attendance tracking
  - Revenue analytics
  - Instructor performance metrics
- **Implementation**: Analytics collection, dashboard UI, reporting tools

### Integration Testing
- **Description**: Comprehensive testing suite for events functionality
- **Features**:
  - Unit tests for all event-related components
  - Integration tests for event workflows
  - E2E tests for critical user paths
  - Performance testing for large event datasets
- **Implementation**: Jest/Testing Library for components, Playwright for E2E

### Implementation Priority Recommendations
1. **High Priority**: Calendar view, advanced search, performance optimizations
2. **Medium Priority**: CRM integration, enhanced EventsByGroup block, event registration tracking
3. **Low Priority**: Multi-language support, event series, wait lists
4. **Future Consideration**: Review system, mobile app support, advanced analytics

Each enhancement should be evaluated based on user feedback and business requirements before implementation.
