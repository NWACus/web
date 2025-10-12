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

- 

**Blocks**

- 

**Components**

- 

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