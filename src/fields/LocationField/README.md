# LocationField

A reusable location field for Payload CMS with an interactive map picker powered by Mapbox.

## Features

- **Interactive Map Picker**: Click anywhere on a Mapbox map to select a location
- **Automatic Reverse Geocoding**: Address information is automatically populated from coordinates
- **Rich Data**: Stores coordinates, address components, and Mapbox metadata
- **Virtual Event Support**: Built-in checkbox for virtual events with URL field
- **Map Display Ready**: Coordinates stored in GeoJSON Point format for easy map rendering
- **Filtering Support**: Enables radius search, state/region filtering, and map bounds filtering
- **TypeScript**: Full type safety with exported types

## Installation

The LocationField is already installed in this project. To use it in a new collection:

1. Ensure Mapbox token is configured in `.env`:

   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

2. Import and use in your collection:
   ```typescript
   import { locationField } from '@/fields/LocationField'
   ```

## Usage

### Basic Example

```typescript
import { locationField } from '@/fields/LocationField'
import type { CollectionConfig } from 'payload'

export const YourCollection: CollectionConfig = {
  slug: 'your-collection',
  fields: [
    locationField({
      name: 'location',
      label: 'Location',
      required: true,
    }),
    // ... other fields
  ],
}
```

### Advanced Example with Custom Config

```typescript
locationField({
  name: 'venue',
  label: 'Event Venue',
  required: false,
  admin: {
    description: 'Search for the venue or enter coordinates manually',
    condition: (data) => data.hasPhysicalLocation === true,
  },
})
```

## Data Structure

The location field stores the following data:

### Core Fields (always available)

- `coordinates` - GeoJSON Point with [longitude, latitude]
- `address` - Street address
- `city` - City name
- `state` - State/province code (e.g., "WA", "OR")
- `postalCode` - ZIP or postal code
- `country` - Country code (defaults to "US")

### Mapbox-Specific Fields (from reverse geocoding)

- `placeName` - Name of the venue or place
- `fullAddress` - Complete formatted address from Mapbox

### Virtual Event Fields

- `isVirtual` - Boolean checkbox
- `virtualUrl` - URL for virtual event (conditional on isVirtual)

### Additional Fields

- `extraInfo` - Freeform text for additional location details

## TypeScript Types

Import types for use in your components:

```typescript
import type { LocationData, Coordinates } from '@/fields/LocationField'

// Use in your component props
interface YourComponentProps {
  location: LocationData
}

// Access coordinates
const [lng, lat]: Coordinates = location.coordinates.coordinates
```

## Frontend Display

### Displaying on a Map

The coordinates are stored in GeoJSON Point format, perfect for Mapbox GL JS:

```typescript
import mapboxgl from 'mapbox-gl'

// Add marker to map
if (location.coordinates) {
  new mapboxgl.Marker().setLngLat(location.coordinates.coordinates).addTo(map)
}
```

### Displaying Address

```typescript
// Prefer fullAddress if available (from geocoding)
const displayAddress =
  location.fullAddress ||
  `${location.address}, ${location.city}, ${location.state} ${location.postalCode}`
```

### Example: Event Location Display

See `/src/components/EventMetadata/index.tsx` for a complete example of displaying location data.

## Filtering & Querying

### Query by State

```typescript
const events = await payload.find({
  collection: 'events',
  where: {
    'location.state': {
      equals: 'WA',
    },
  },
})
```

### Radius Search (with Payload Point field)

```typescript
// Find events within 50 miles of Seattle
const events = await payload.find({
  collection: 'events',
  where: {
    'location.coordinates': {
      near: [-122.3321, 47.6062, 50], // [lng, lat, distance in miles]
    },
  },
})
```

## Admin Panel Behavior

### Map Picker Workflow

1. User clicks "Pick on Map" button
2. Interactive Mapbox map opens in a modal
3. User clicks anywhere on the map to select a location
4. A red marker appears at the clicked location
5. Reverse geocoding automatically fetches the address
6. User clicks "Confirm Location" to save
7. Location summary is displayed with "Change Location" button

### Display Mode

- Shows the full address and coordinates
- "Change Location" button reopens the map picker
- All location data is stored for filtering and display

## Collections Using LocationField

- **Events** (`/src/collections/Events/index.ts`) - Event locations
- **Providers** (planned) - Organization/provider locations

## Mapbox Pricing & Limits

- **Free tier**: 100,000 requests/month
- **Permanent Geocoding**: $5/1000 requests (for storing results)
- **Current usage**: <1,000/month (well within free tier)

## Migration from Old Location Field

The old Events location field used these fields:

- `venue` → now `placeName`
- `zip` → now `postalCode`
- `address`, `city`, `state` → unchanged

If migrating existing data:

1. Map `venue` to `placeName`
2. Map `zip` to `postalCode`
3. Optionally geocode addresses to add coordinates

## Troubleshooting

### "NEXT_PUBLIC_MAPBOX_TOKEN is not configured"

Add your Mapbox token to `.env`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHg1YmN4eTYwMmR1MmpzN3J1YnJxZTIifQ.abc123
```

### Coordinates not saving in manual mode

Ensure longitude is between -180 and 180, and latitude is between -90 and 90.

### Location not displaying on frontend

Check that the component is accessing the new field names:

- Use `location.placeName` instead of `location.venue`
- Use `location.postalCode` instead of `location.zip`

## Future Enhancements

- [x] Interactive map in admin panel to visually select/adjust location
- [x] Reverse geocoding (click map to get address)
- [ ] Bulk geocoding tool for existing data
- [ ] Support for other geocoding providers (Google Places, HERE, etc.)
- [ ] Bounding box storage for filtering by viewport
- [ ] Map preview thumbnail in display mode
