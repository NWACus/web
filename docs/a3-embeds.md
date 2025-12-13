# A3 Embeds

This document describes the embeddable widgets for American Avalanche Association (A3) course and provider data. These embeds allow external websites to display avalanche education providers and courses via iframes.

## Overview

Two embed routes are available:

| Endpoint | Description |
|----------|-------------|
| `/embeds/providers` | Displays all published providers organized by state |
| `/embeds/courses` | Displays a filterable list of published courses |

Both embeds:
- Use the `@open-iframe-resizer` library for automatic height adjustment
- Apply A3-specific styling (Fjalla One for headings, Libre Franklin for body text)
- Only show published content
- Work without cookies (localStorage-based analytics)

## Providers Embed

**Endpoint:** `/embeds/providers`

Displays all published avalanche education providers organized by state in a two-column accordion layout.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | none | Optional header title to display above the provider list |

### Example Usage

```html
<iframe
  id="avy-web-embed-provider"
  src="https://yoursite.com/embeds/providers"
  height="0"
  scrolling="true"
  width="100%"
></iframe>
<script type="module">
  import { initialize } from "https://cdn.jsdelivr.net/npm/@open-iframe-resizer/core@v2.1.0/dist/index.min.js";
  initialize({}, "#avy-web-embed-provider");
</script>
```

With a custom title:
```html
<iframe
  id="avy-web-embed-provider"
  src="https://yoursite.com/embeds/providers?title=Find%20a%20Provider"
  height="0"
  scrolling="true"
  width="100%"
></iframe>
```

### Behavior

- Providers are grouped by their `statesServiced` field (a provider can appear under multiple states)
- States are sorted alphabetically and split into two columns
- Clicking a provider opens a modal with details: name, course types offered, location, website, email, and phone

## Courses Embed

**Endpoint:** `/embeds/courses`

Displays a paginated, filterable list of upcoming avalanche courses with infinite scroll.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | none | Optional header title |
| `showFilters` | boolean | `false` | Show/hide the filter sidebar (desktop) and filter drawer (mobile) |
| `types` | string | none | Filter by course types (comma-separated values) |
| `providers` | string | none | Filter by provider slugs (comma-separated) |
| `states` | string | none | Filter by location states (comma-separated state codes) |
| `affinityGroups` | string | none | Filter by affinity groups (comma-separated values) |
| `modesOfTravel` | string | none | Filter by travel modes (comma-separated values) |
| `startDate` | string | none | Filter start date (ISO format) |
| `endDate` | string | none | Filter end date (ISO format) |

### Filter Values

#### Course Types (`types`)

| Value | Label | Description |
|-------|-------|-------------|
| `rec-1` | Rec 1 | Recreational Level 1: Introduction to avalanche safety |
| `rec-2` | Rec 2 | Recreational Level 2: Advanced recreational course |
| `pro-1` | Pro 1 | Professional Level 1: Entry-level professional training |
| `pro-2` | Pro 2 | Professional Level 2: Advanced professional course |
| `rescue` | Rescue | Avalanche rescue courses |
| `awareness-external` | Awareness | Introductory avalanche awareness sessions |

#### Affinity Groups (`affinityGroups`)

| Value | Label |
|-------|-------|
| `lgbtq` | For LGBTQ+ |
| `women` | For Women |
| `youth` | For Youth |

#### Modes of Travel (`modesOfTravel`)

| Value | Label |
|-------|-------|
| `ski` | Ski |
| `splitboard` | Splitboard |
| `motorized` | Motorized |
| `snowshoe` | Snowshoe |

### Example Usage

Basic embed showing all upcoming courses:
```html
<iframe
  src="https://yoursite.com/embeds/courses"
  height="800px"
  scrolling="true"
  width="100%"
></iframe>
```

With filters enabled:
```html
<iframe
  src="https://yoursite.com/embeds/courses?showFilters=true"
  height="800px"
  scrolling="true"
  width="100%"
></iframe>
```

Pre-filtered to show only Rec 1 courses in Washington:
```html
<iframe
  src="https://yoursite.com/embeds/courses?types=rec-1&states=WA"
  height="800px"
  scrolling="true"
  width="100%"
></iframe>
```

Multiple filters (Rec 1 and Rec 2 courses for women):
```html
<iframe
  src="https://yoursite.com/embeds/courses?types=rec-1,rec-2&affinityGroups=women&showFilters=true"
  height="800px"
  scrolling="true"
  width="100%"
></iframe>
```

### Behavior

- By default, only shows courses starting after today's date (upcoming courses)
- If `startDate` and/or `endDate` are provided, those override the default "upcoming only" behavior
- Courses are paginated with 10 items per page
- Infinite scroll loads more courses as the user scrolls
- Past courses display a "Past Course" badge
- Each course links to its external registration URL

## Using with iframe-resizer

For automatic height adjustment, use the `@open-iframe-resizer` library. The embeds include the necessary child script automatically.

Parent page setup:
```html
<iframe id="my-embed" src="https://yoursite.com/embeds/providers"></iframe>
<script type="module">
  import { initialize } from "https://cdn.jsdelivr.net/npm/@open-iframe-resizer/core@v2.1.0/dist/index.min.js";
  initialize({}, "#my-embed");
</script>
```

Without iframe-resizer, set an appropriate fixed height:
```html
<iframe src="https://yoursite.com/embeds/courses?showFilters=true" height="800px" width="100%"></iframe>
```

## Styling

The embeds use A3-specific fonts and styling defined in `src/app/(embeds)/a3-globals.css`:
- Headings: Fjalla One
- Body text: Libre Franklin

The embeds have a white background by default and are designed to blend into most websites.

## Implementation Details

### File Structure

```
src/app/(embeds)/
├── layout.tsx                    # Embed layout with fonts and PostHog
├── a3-globals.css                # A3-specific styling
└── embeds/
    ├── providers/
    │   └── page.tsx              # Providers embed
    └── courses/
        ├── page.tsx              # Courses embed
        ├── CoursesFilters.tsx    # Desktop filter sidebar
        └── CoursesMobileFilters.tsx  # Mobile filter drawer
```

### Related Components

- `src/components/ProviderPreview.tsx` - Provider detail modal
- `src/components/CoursesList.tsx` - Courses list with infinite scroll
- `src/components/CoursePreviewSmallRow.tsx` - Individual course card
- `src/utilities/queries/getCourses.ts` - Course query logic
- `src/utilities/queries/getProviders.ts` - Provider query logic

### Data Collections

- **Providers**: Avalanche education providers with contact info, location, and course types offered
- **Courses**: Individual course instances with dates, location, provider reference, and registration details
