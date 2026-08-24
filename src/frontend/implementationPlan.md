# Tourism Explorer Component Implementation Plan

Build a production-grade, responsive **Tourism Explorer** HyperDart component in [`src/frontend/NewComponent.jsx`](file:///c:/Users/net7/Desktop/kari/src/frontend/NewComponent.jsx) adhering strictly to the PRD specifications with Geoapify Places API integration, interactive Leaflet mapping, filtering, query categorization, trip planning, and fallback data support.

## User Review Required

> [!IMPORTANT]
> The component will connect to the Geoapify Places API using the required format: `https://api.geoapify.com/v2/places?categories=tourism.sights&filter=circle:{longitude},{latitude},5000&limit=20&apiKey=YOUR_API_KEY`.
> A default working demo key and high-fidelity fallback datasets for NYC, Paris, Kyoto, Rome, Tokyo, and London are included to guarantee a functional experience even when offline or rate-limited.

---

## Proposed Changes

### Configuration & Schema Layer

#### [MODIFY] [hyperdart.config.js](file:///c:/Users/net7/Desktop/kari/hyperdart.config.js)
- Populate `triggers.keywords` with all keywords from PRD Section 6.1:
  `['tourist attraction', 'tourist attractions', 'things to do', 'places to visit', 'landmarks', 'sights', 'points of interest']`
- Populate `query_format.regex` with all 6 regex patterns from PRD Section 6.2 matching `HD_LOCATION`.

#### [MODIFY] [resource.json](file:///c:/Users/net7/Desktop/kari/resource.json)
- Update resource schema definitions for tourism attractions, coordinates, filters, city location, and categories.

#### [MODIFY] [searchData.json](file:///c:/Users/net7/Desktop/kari/searchData.json)
- Add complete sample payloads for NYC, Paris, Kyoto, Rome, Tokyo, and London matching PRD Section 10 structure for testing.

---

### Component Implementation

#### [MODIFY] [src/frontend/NewComponent.jsx](file:///c:/Users/net7/Desktop/kari/src/frontend/NewComponent.jsx)
- **Data & Entity Resolution**:
  - Extract city name, latitude, and longitude from `props.searchData` (`entities[0].entityInfo.geo.lat`, `entities[0].entityInfo.geo.long` or `lon`).
  - Extract query intent and map query phrases ("landmarks", "museums", "nature", "viewpoints", "historic") to optimal Geoapify category filters.
  - Exclude restaurants (`catering`) and lodging (`accommodation`) from primary results.
  - Trigger `props?.messageHandlers?.componentLoaded()` upon successful load and render.
- **Geoapify API & Resiliency**:
  - Fetch places from Geoapify Places API with `filter=circle:${lon},${lat},5000` and `limit=20`.
  - Provide offline fallback dataset for instant preview if API key is invalid/exhausted.
  - Calculate distance from city coordinates for each attraction.
- **Interactive UI & Visual Design**:
  - **Header & City Overview**: City title, coordinates badge, weather preview, live search bar, and city switcher.
  - **View Modes**:
    - **Split View**: Synchronized interactive Leaflet Map on one side and attraction cards on the other.
    - **Grid View**: Multi-column cards with imagery, badges, and quick actions.
    - **List View**: Dense list for rapid browsing.
  - **Interactive Leaflet Map**:
    - Custom styled POI pins with category icons.
    - Interactive popups and fly-to animation when hovering or selecting attraction cards.
  - **Filtering & Sorting**:
    - Category pills: "All", "🏛️ Landmarks", "🎨 Museums", "🏰 Historical", "🌿 Parks & Nature", "🔭 Viewpoints".
    - Sort dropdown: "Closest Distance", "Name (A-Z)", "Top Rated / Category".
  - **Attraction Detail Modal & Audio Guide**:
    - Detailed drawer modal with description, address, coordinates, copy coordinates, and external navigation links (Google Maps / Apple Maps / OSM).
    - Built-in text-to-speech audio guide narration 🎧.
  - **Day Trip Itinerary Builder**:
    - Bookmark favorite sights into a custom itinerary.
    - View total route distance, estimated visit durations, and export/share itinerary.

---

## Verification Plan

### Automated Tests / Build
- Run `npm run build` to ensure the modern bundle builds cleanly without syntax or bundling errors.

### Manual Verification
- Test dev server with multiple city queries (`Tourist attractions in NYC`, `things to do in Paris`, `places to visit in Kyoto`, `landmarks in Rome`).
- Verify category filters, live search, map marker interactions, detail modal, itinerary builder, and speech synthesis narration.
