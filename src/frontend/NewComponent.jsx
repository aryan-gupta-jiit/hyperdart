import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Modal,
  Drawer,
  Badge,
  Tooltip,
  Skeleton,
  Snackbar,
  Alert,
  Divider,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Explore as ExploreIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  ViewSidebar as ViewSidebarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Navigation as NavigationIcon,
  ContentCopy as ContentCopyIcon,
  DirectionsWalk as WalkIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
  Share as ShareIcon,
  Museum as MuseumIcon,
  AccountBalance as LandmarkIcon,
  Park as ParkIcon,
  Castle as CastleIcon,
  TravelExplore as TravelExploreIcon,
  DeleteOutline as DeleteOutlineIcon,
  Launch as LaunchIcon,
  Key as KeyIcon,
  FlightTakeoff as FlightIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import heroImg from '../asssets/hero-img.jpg';

const DEFAULT_GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "3ffa7bc17b4f409ba44ce5280a3a2e09";

const CATEGORY_MAP = {
  all: {
    label: "All Sights",
    icon: <ExploreIcon fontSize="small" />,
    color: "#2563eb",
    geoFilter: "tourism.sights,tourism.attraction"
  },
  landmarks: {
    label: "Landmarks & Monuments",
    icon: <LandmarkIcon fontSize="small" />,
    color: "#1d4ed8",
    geoFilter: "tourism.sights.monument,tourism.sights.memorial,building.historic"
  },
  museums: {
    label: "Museums & Arts",
    icon: <MuseumIcon fontSize="small" />,
    color: "#0284c7",
    geoFilter: "tourism.sights.museum,entertainment.museum"
  },
  nature: {
    label: "Parks & Viewpoints",
    icon: <ParkIcon fontSize="small" />,
    color: "#0369a1",
    geoFilter: "tourism.sights.viewpoint,leisure.park,natural"
  },
  historic: {
    label: "Heritage & Castles",
    icon: <CastleIcon fontSize="small" />,
    color: "#1e3a8a",
    geoFilter: "tourism.sights.castle,tourism.sights.place_of_worship,heritage"
  }
};

const PRESET_CITIES = [
  { name: "New York City", short: "NYC", lat: 40.7128, lon: -74.006, country: "United States", countryCode: "US" },
  { name: "Paris", short: "Paris", lat: 48.8566, lon: 2.3522, country: "France", countryCode: "FR" },
  { name: "Kyoto", short: "Kyoto", lat: 35.0116, lon: 135.7681, country: "Japan", countryCode: "JP" },
  { name: "Rome", short: "Rome", lat: 41.9028, lon: 12.4964, country: "Italy", countryCode: "IT" },
  { name: "Tokyo", short: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Japan", countryCode: "JP" },
  { name: "London", short: "London", lat: 51.5074, lon: -0.1278, country: "United Kingdom", countryCode: "GB" },
  { name: "Barcelona", short: "Barcelona", lat: 41.3851, lon: 2.1734, country: "Spain", countryCode: "ES" }
];

const FALLBACK_ATTRACTIONS = {
  "New York City": [
    {
      id: "fb-1",
      name: "Empire State Building",
      category: "Landmark & Viewpoint",
      categories: ["tourism.sights", "tourism.sights.viewpoint"],
      address: "20 W 34th St, New York, NY 10001",
      lat: 40.7484,
      lon: -73.9857,
      description: "Iconic 102-story Art Deco skyscraper offering breathtaking 360-degree panoramic views of New York City and beyond.",
      distKm: 4.8
    },
    {
      id: "fb-2",
      name: "Central Park",
      category: "Parks & Nature",
      categories: ["tourism.sights", "leisure.park"],
      address: "Central Park, New York, NY",
      lat: 40.7829,
      lon: -73.9654,
      description: "Sprawling 843-acre urban oasis featuring meadows, lakes, walking trails, historic bridges, and famous cultural spots.",
      distKm: 8.5
    },
    {
      id: "fb-3",
      name: "Statue of Liberty",
      category: "Monuments & Heritage",
      categories: ["tourism.sights", "tourism.sights.monument"],
      address: "Liberty Island, New York, NY 10004",
      lat: 40.6892,
      lon: -74.0445,
      description: "World-renowned colossal neoclassical sculpture gifted by France, representing freedom and democracy standing in New York Harbor.",
      distKm: 4.1
    },
    {
      id: "fb-4",
      name: "The Metropolitan Museum of Art (The Met)",
      category: "Museums & Arts",
      categories: ["tourism.sights", "tourism.sights.museum"],
      address: "1000 5th Ave, New York, NY 10028",
      lat: 40.7794,
      lon: -73.9632,
      description: "One of the world's greatest art museums showcasing over 5,000 years of global art, ancient relics, and masterpieces.",
      distKm: 8.2
    },
    {
      id: "fb-5",
      name: "Brooklyn Bridge",
      category: "Historical Site",
      categories: ["tourism.sights", "building.historic"],
      address: "Brooklyn Bridge, New York, NY 10038",
      lat: 40.7061,
      lon: -73.9969,
      description: "Historic 1883 hybrid cable-stayed suspension bridge connecting Manhattan and Brooklyn with iconic Gothic stone arches.",
      distKm: 1.1
    }
  ]
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function formatPlaceData(feature, cityLat, cityLon) {
  const props = feature.properties || {};
  const lat = props.lat || feature.geometry?.coordinates?.[1] || 0;
  const lon = props.lon || feature.geometry?.coordinates?.[0] || 0;
  const categories = props.categories || [];

  const isCatering = categories.some((c) => c.startsWith("catering"));
  const isLodging = categories.some((c) => c.startsWith("accommodation"));
  const isCommercial = categories.some((c) => c.startsWith("commercial") && !c.includes("attraction"));

  if (isCatering || isLodging || isCommercial) {
    return null;
  }

  let primaryCategory = "Tourist Attraction";
  let badgeColor = "#2563eb";
  let iconType = "sight";

  if (categories.some((c) => c.includes("museum") || c.includes("gallery"))) {
    primaryCategory = "Museum & Art";
    badgeColor = "#0284c7";
    iconType = "museum";
  } else if (categories.some((c) => c.includes("monument") || c.includes("memorial") || c.includes("statue"))) {
    primaryCategory = "Landmark & Monument";
    badgeColor = "#1d4ed8";
    iconType = "landmark";
  } else if (categories.some((c) => c.includes("castle") || c.includes("historic") || c.includes("heritage"))) {
    primaryCategory = "Historic Heritage";
    badgeColor = "#1e3a8a";
    iconType = "historic";
  } else if (categories.some((c) => c.includes("viewpoint") || c.includes("park") || c.includes("natural"))) {
    primaryCategory = "Park & Viewpoint";
    badgeColor = "#0369a1";
    iconType = "nature";
  } else if (categories.some((c) => c.includes("place_of_worship") || c.includes("temple") || c.includes("church"))) {
    primaryCategory = "Cultural & Temple";
    badgeColor = "#1d4ed8";
    iconType = "temple";
  }

  const name =
    props.name ||
    props.address_line1 ||
    props.formatted?.split(",")?.[0] ||
    "Point of Interest";

  const address =
    props.formatted ||
    [props.street, props.suburb || props.district, props.city, props.country]
      .filter(Boolean)
      .join(", ") ||
    "Location details available in map";

  const description =
    props.description ||
    (props.historic?.memorial ? `Historic ${props.historic.memorial} site.` : "") ||
    (props.datasource?.raw?.description ? props.datasource.raw.description : "") ||
    `Famous ${primaryCategory.toLowerCase()} located in ${props.city || "the area"}.`;

  const distKm = calculateDistance(cityLat, cityLon, lat, lon);

  return {
    id: props.place_id || `${lat}_${lon}_${name}`,
    name,
    primaryCategory,
    categories,
    badgeColor,
    iconType,
    lat,
    lon,
    address,
    description,
    distKm,
    country: props.country,
    city: props.city,
    postcode: props.postcode,
    website: props.website || props.datasource?.raw?.website,
    wikidata: props.datasource?.raw?.wikidata
  };
}

// --- Geoapify API Caching & Rate Limiting System ---
const PLACES_CACHE_MEMORY = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour TTL
let lastApiRequestTimestamp = 0;
const MIN_API_INTERVAL_MS = 500; // Geoapify 500ms rate limit protection

const getCachedPlaces = (key) => {
  if (PLACES_CACHE_MEMORY.has(key)) {
    const item = PLACES_CACHE_MEMORY.get(key);
    if (Date.now() - item.timestamp < CACHE_TTL_MS) {
      return item.data;
    }
  }
  try {
    const raw = sessionStorage.getItem(`geoapify_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        PLACES_CACHE_MEMORY.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {
    // Ignore storage quota errors
  }
  return null;
};

const setCachedPlaces = (key, data) => {
  const item = { data, timestamp: Date.now() };
  PLACES_CACHE_MEMORY.set(key, item);
  try {
    sessionStorage.setItem(`geoapify_cache_${key}`, JSON.stringify(item));
  } catch (e) {
    // Ignore storage quota errors
  }
};

export default function TourismExplorer(props) {
  const rawData = useMemo(() => {
    if (!props?.searchData) return null;
    if (Array.isArray(props.searchData)) return props.searchData[0] || null;
    return props.searchData;
  }, [props?.searchData]);

  const entityGeo = rawData?.entities?.[0]?.entityInfo?.geo;
  const initialCityName =
    entityGeo?.city ||
    rawData?.entities?.[0]?.word ||
    "New York City";
  const initialLat = entityGeo?.lat || 40.7128;
  const initialLon = entityGeo?.long || entityGeo?.lon || -74.006;

  const [darkMode, setDarkMode] = useState(false);
  const [currentCity, setCurrentCity] = useState({
    name: initialCityName,
    lat: initialLat,
    lon: initialLon,
    country: entityGeo?.country || "United States"
  });

  const [apiKey, setApiKey] = useState(DEFAULT_GEOAPIFY_KEY);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("distance");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!document.getElementById("google-font-montserrat-raleway")) {
      const link = document.createElement("link");
      link.id = "google-font-montserrat-raleway";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Raleway:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    if (typeof props?.messageHandlers?.componentLoaded === "function") {
      props.messageHandlers.componentLoaded();
    }
  }, []);

  useEffect(() => {
    if (rawData?.query) {
      const q = rawData.query.toLowerCase();
      if (q.includes("landmark") || q.includes("monument")) {
        setSelectedCategory("landmarks");
      } else if (q.includes("museum") || q.includes("art") || q.includes("gallery")) {
        setSelectedCategory("museums");
      } else if (q.includes("nature") || q.includes("park") || q.includes("viewpoint")) {
        setSelectedCategory("nature");
      } else if (q.includes("historic") || q.includes("castle") || q.includes("heritage")) {
        setSelectedCategory("historic");
      }
    }
  }, [rawData?.query]);

  useEffect(() => {
    if (entityGeo?.lat && (entityGeo?.long || entityGeo?.lon)) {
      setCurrentCity({
        name: entityGeo.city || rawData?.entities?.[0]?.word || "New York City",
        lat: entityGeo.lat,
        lon: entityGeo.long || entityGeo.lon,
        country: entityGeo.country || "United States"
      });
    }
  }, [entityGeo, rawData?.entities]);

  const fetchPlaces = useCallback(async () => {
    const cacheKey = `${currentCity.lat.toFixed(3)}_${currentCity.lon.toFixed(3)}_${radiusMeters}_${selectedCategory}_${apiKey}`;

    // 1. Instant Cache Lookup (Memory + SessionStorage)
    const cachedData = getCachedPlaces(cacheKey);
    if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
      setPlaces(cachedData);
      setError(null);
      setLoading(false);
      return;
    }

    // 2. Client-side Rate Limiting (500ms minimum interval between API calls)
    const now = Date.now();
    const elapsed = now - lastApiRequestTimestamp;
    if (elapsed < MIN_API_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_API_INTERVAL_MS - elapsed));
    }
    lastApiRequestTimestamp = Date.now();

    setLoading(true);
    setError(null);

    const geoFilterCategory =
      CATEGORY_MAP[selectedCategory]?.geoFilter || "tourism.sights";
    const endpoint = `https://api.geoapify.com/v2/places?categories=${geoFilterCategory}&filter=circle:${currentCity.lon},${currentCity.lat},${radiusMeters}&limit=20&apiKey=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`Geoapify API responded with status ${res.status}`);
      }
      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        const formatted = data.features
          .map((feat) => formatPlaceData(feat, currentCity.lat, currentCity.lon))
          .filter(Boolean);

        const resultToStore = formatted.length > 0 ? formatted : (FALLBACK_ATTRACTIONS[currentCity.name] || []);
        setPlaces(resultToStore);
        setCachedPlaces(cacheKey, resultToStore);
      } else {
        const fallback = FALLBACK_ATTRACTIONS[currentCity.name] || [];
        setPlaces(fallback);
        setCachedPlaces(cacheKey, fallback);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.warn("Geoapify API request timed out after 5 seconds");
      } else {
        console.warn("Geoapify Places API fetch error:", err);
      }
      const fallback = FALLBACK_ATTRACTIONS[currentCity.name] || [
        {
          id: `fb-def-1`,
          name: `${currentCity.name} Central Historic Landmark`,
          primaryCategory: "Landmark & Monument",
          categories: ["tourism.sights"],
          badgeColor: "#f59e0b",
          iconType: "landmark",
          lat: currentCity.lat + 0.005,
          lon: currentCity.lon + 0.005,
          address: `Historic Center, ${currentCity.name}, ${currentCity.country}`,
          description: `Famous prominent heritage attraction in the heart of ${currentCity.name}.`,
          distKm: 0.6
        },
        {
          id: `fb-def-2`,
          name: `${currentCity.name} Museum of Art & Culture`,
          primaryCategory: "Museum & Art",
          categories: ["tourism.sights.museum"],
          badgeColor: "#ec4899",
          iconType: "museum",
          lat: currentCity.lat - 0.008,
          lon: currentCity.lon + 0.006,
          address: `Museum Quarter, ${currentCity.name}`,
          description: `Renowned cultural hub housing historic art, exhibitions, and historical artifacts.`,
          distKm: 1.2
        },
        {
          id: `fb-def-3`,
          name: `${currentCity.name} Scenic Panorama Viewpoint`,
          primaryCategory: "Park & Viewpoint",
          categories: ["tourism.sights.viewpoint"],
          badgeColor: "#10b981",
          iconType: "nature",
          lat: currentCity.lat + 0.012,
          lon: currentCity.lon - 0.01,
          address: `Skyline Vista, ${currentCity.name}`,
          description: `Breathtaking scenic vantage point overlooking the entire skyline and landmarks.`,
          distKm: 1.8
        }
      ];
      setPlaces(fallback);
      setCachedPlaces(cacheKey, fallback);
      setError("Network or API rate limit reached. Displaying offline highlights.");
    } finally {
      setLoading(false);
    }
  }, [currentCity, radiusMeters, selectedCategory, apiKey]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const filteredPlaces = useMemo(() => {
    return places
      .filter((place) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          place.name.toLowerCase().includes(q) ||
          place.address.toLowerCase().includes(q) ||
          place.primaryCategory.toLowerCase().includes(q) ||
          place.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "distance") {
          return (a.distKm ?? 999) - (b.distKm ?? 999);
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "category") {
          return a.primaryCategory.localeCompare(b.primaryCategory);
        }
        return 0;
      });
  }, [places, searchQuery, sortBy]);

  useEffect(() => {
    if (!mapContainerRef.current || (viewMode !== "split" && viewMode !== "map")) return;

    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentCity.lat, currentCity.lon],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const layer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = layer;
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([currentCity.lat, currentCity.lon], 13);
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(tileUrl);
      }
    }

    const map = mapInstanceRef.current;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const cityIcon = L.divIcon({
      className: "custom-city-pin",
      html: `
        <div style="
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(37,99,235,0.45);
          border: 2px solid ${darkMode ? "#0f172a" : "white"};
          font-weight: bold;
        ">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const cityMarker = L.marker([currentCity.lat, currentCity.lon], { icon: cityIcon })
      .bindPopup(`<b>${currentCity.name}</b><br/>City Center`)
      .addTo(map);
    markersRef.current["city-center"] = cityMarker;

    filteredPlaces.forEach((place, idx) => {
      if (!place.lat || !place.lon) return;

      const isSelected = activeMarkerId === place.id || selectedPlace?.id === place.id;
      const isBookmarked = itinerary.some((item) => item.id === place.id);

      const markerHtml = `
        <div style="
          background: ${isSelected ? (darkMode ? "#ffffff" : "#000000") : place.badgeColor};
          color: ${isSelected && darkMode ? "#000000" : "#ffffff"};
          width: ${isSelected ? "36px" : "28px"};
          height: ${isSelected ? "36px" : "28px"};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSelected ? "14px" : "12px"};
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 2px solid ${darkMode ? "#1e293b" : "white"};
          cursor: pointer;
          transition: all 0.2s ease;
          transform: ${isSelected ? "scale(1.2)" : "scale(1)"};
        ">
          ${isBookmarked ? "★" : idx + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-poi-marker",
        html: markerHtml,
        iconSize: isSelected ? [36, 36] : [28, 28],
        iconAnchor: isSelected ? [18, 18] : [14, 14]
      });

      const marker = L.marker([place.lat, place.lon], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px; padding: 4px; color: #1e293b;">
            <div style="font-size: 11px; font-weight: 700; color: ${place.badgeColor}; text-transform: uppercase; margin-bottom: 2px;">
              ${place.primaryCategory}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              ${place.name}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
              📍 ${place.distKm != null ? `${place.distKm} km from center` : place.address}
            </div>
            <button id="view-details-btn-${place.id}" style="
              background: #2563eb;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
              width: 100%;
            ">
              Explore Details
            </button>
          </div>
        `)
        .addTo(map);

      marker.on("popupopen", () => {
        setActiveMarkerId(place.id);
        const btn = document.getElementById(`view-details-btn-${place.id}`);
        if (btn) {
          const handleOpen = (e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            setSelectedPlace(place);
          };
          btn.onclick = handleOpen;
          btn.ontouchend = handleOpen;
        }
      });

      marker.on("popupclose", () => {
        if (activeMarkerId === place.id) {
          setActiveMarkerId(null);
        }
      });

      markersRef.current[place.id] = marker;
    });

    if (filteredPlaces.length > 0) {
      const group = new L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [filteredPlaces, currentCity, viewMode, activeMarkerId, selectedPlace, itinerary, darkMode]);

  const handleFocusPlace = (place) => {
    setActiveMarkerId(place.id);
    if (mapInstanceRef.current && place.lat && place.lon) {
      mapInstanceRef.current.flyTo([place.lat, place.lon], 15, { duration: 0.8 });
      const marker = markersRef.current[place.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const toggleBookmark = (place, e) => {
    if (e) e.stopPropagation();
    setItinerary((prev) => {
      const exists = prev.some((item) => item.id === place.id);
      if (exists) {
        setToastMessage(`Removed "${place.name}" from itinerary`);
        return prev.filter((item) => item.id !== place.id);
      } else {
        setToastMessage(`Added "${place.name}" to itinerary!`);
        return [...prev, place];
      }
    });
  };

  const handleToggleSpeech = (text) => {
    if (!('speechSynthesis' in window)) {
      setToastMessage("Text-to-speech is not supported on this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedPlace]);

  const copyCoordinates = (lat, lon) => {
    navigator.clipboard.writeText(`${lat}, ${lon}`);
    setToastMessage(`Coordinates copied: ${lat}, ${lon}`);
  };

  const copyItinerary = () => {
    if (itinerary.length === 0) return;
    const text = itinerary
      .map((item, idx) => `${idx + 1}. ${item.name} (${item.primaryCategory})\n   📍 ${item.address}\n   🚗 Distance: ${item.distKm} km`)
      .join("\n\n");
    const fullSummary = `🗺️ My Day Trip Itinerary in ${currentCity.name}\n\n${text}\n\nGenerated with HyperDart Tourism Explorer`;
    navigator.clipboard.writeText(fullSummary);
    setToastMessage("Itinerary copied to clipboard!");
  };

  const themeColors = {
    bg: darkMode ? "#0b1329" : "#f0f4f8",
    cardBg: darkMode ? "#131c33" : "#ffffff",
    cardBorder: darkMode ? "#1e2d54" : "#cbd5e1",
    textPrimary: darkMode ? "#f8fafc" : "#0f172a",
    textSecondary: darkMode ? "#94a3b8" : "#475569",
    headerBg: darkMode ? "#0f172a" : "#1e3a8a",
    primaryBlue: "#2563eb",
    darkBlue: "#1d4ed8",
    activeCard: darkMode ? "#1e2d54" : "#e0e7ff",
    modalBg: darkMode ? "#131c33" : "#ffffff",
    neoRaised: darkMode
      ? "6px 6px 14px #070c1a, -6px -6px 14px #1f2c4c"
      : "6px 6px 14px #cbd2dc, -6px -6px 14px #ffffff",
    neoRaisedSm: darkMode
      ? "3px 3px 8px #070c1a, -3px -3px 8px #1f2c4c"
      : "3px 3px 8px #cbd2dc, -3px -3px 8px #ffffff",
    neoInset: darkMode
      ? "inset 3px 3px 6px #070c1a, inset -3px -3px 6px #1f2c4c"
      : "inset 3px 3px 6px #cbd2dc, inset -3px -3px 6px #ffffff",
    neoHover: darkMode
      ? "8px 8px 18px #070c1a, -8px -8px 18px #1f2c4c"
      : "8px 8px 18px #cbd2dc, -8px -8px 18px #ffffff",
    neoInputBg: darkMode ? "#0d162d" : "#e2e8f0",
    neoButtonBg: darkMode ? "#1d4ed8" : "#2563eb"
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        p: { xs: 1.5, sm: 2.5 },
        position: "relative",
        fontFamily: "'Raleway', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
        color: themeColors.textPrimary,
        backgroundColor: themeColors.bg,
        minHeight: "100vh",
        transition: "background-color 0.3s ease, color 0.3s ease",
        "& h1, & h2, & h3, & h4, & h5, & h6, & .MuiButton-root, & .MuiTypography-h4, & .MuiTypography-h5, & .MuiTypography-h6, & .MuiTypography-subtitle1": {
          fontFamily: "'Montserrat', sans-serif !important"
        }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 4,
          backgroundColor: darkMode ? "#0f172a" : "#1b2a4a",
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: themeColors.neoRaised
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: darkMode ? 0.22 : 0.32,
            pointerEvents: "none"
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={2.5}>
            <Box
              sx={{
                width: { xs: 90, sm: 110 },
                height: { xs: 90, sm: 110 },
                aspectRatio: "1/1",
                borderRadius: "16px",
                overflow: "hidden",
                flexShrink: 0,
                boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                border: "2px solid rgba(255,255,255,0.3)",
                backgroundImage: `url(${heroImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <TravelExploreIcon sx={{ fontSize: 28, color: "#67e8f9" }} />
                <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 700, color: "#e0f2fe" }}>
                  HyperDart Tourism Explorer
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 0.5 }}>
                {currentCity.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#e0f2fe", opacity: 0.9, display: "flex", alignItems: "center", gap: 1 }}>
                <LocationIcon sx={{ fontSize: 16 }} />
                {currentCity.lat.toFixed(4)}° N, {Math.abs(currentCity.lon).toFixed(4)}° {currentCity.lon >= 0 ? "E" : "W"} • {currentCity.country}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton
                onClick={() => setDarkMode(!darkMode)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" }
                }}
              >
                {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="View Saved Day Trip Itinerary">
              <Button
                variant="contained"
                onClick={() => setItineraryOpen(true)}
                startIcon={
                  <Badge badgeContent={itinerary.length} color="secondary">
                    <BookmarkIcon />
                  </Badge>
                }
                sx={{
                  height: 40,
                  minWidth: 140,
                  px: 2,
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#1d4ed8" }
                }}
              >
                Itinerary ({itinerary.length})
              </Button>
            </Tooltip>

            <Tooltip title="API Settings">
              <IconButton
                onClick={() => setSettingsOpen(true)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" }
                }}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box sx={{ mt: 2.5, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <Typography variant="caption" sx={{ color: "#bae6fd", display: "block", mb: 1, fontWeight: 600 }}>
            QUICK EXPLORE POPULAR DESTINATIONS:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5, "::-webkit-scrollbar": { display: "none" } }}>
            {PRESET_CITIES.map((city) => {
              const isActive = currentCity.name.toLowerCase() === city.name.toLowerCase();
              return (
                <Chip
                  key={city.name}
                  label={city.name}
                  onClick={() => {
                    setCurrentCity({
                      name: city.name,
                      lat: city.lat,
                      lon: city.lon,
                      country: city.country
                    });
                  }}
                  icon={<FlightIcon sx={{ fontSize: "14px !important", color: isActive ? "#1e3a8a !important" : "white !important" }} />}
                  sx={{
                    backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0.15)",
                    color: isActive ? "#1e3a8a" : "white",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0.3)" }
                  }}
                />
              );
            })}
          </Stack>
        </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 4,
          backgroundColor: themeColors.cardBg,
          border: "none",
          boxShadow: themeColors.neoRaised,
          transition: "all 0.3s ease"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            flexWrap: { xs: "wrap", md: "nowrap" },
            gap: 1.5
          }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: { xs: "100%", sm: 220 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search attractions, landmarks, museums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: themeColors.textPrimary,
                  backgroundColor: themeColors.neoInputBg,
                  borderRadius: 3,
                  boxShadow: themeColors.neoInset,
                  "& fieldset": { border: "none" }
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: themeColors.textSecondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery("")}>
                        <CloseIcon fontSize="small" sx={{ color: themeColors.textSecondary }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, flex: "0 0 auto" }}>
            <FormControl size="small" sx={{ minWidth: 125 }}>
              <InputLabel sx={{ color: themeColors.textSecondary }}>Radius</InputLabel>
              <Select
                value={radiusMeters}
                label="Radius"
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                sx={{
                  color: themeColors.textPrimary,
                  backgroundColor: themeColors.neoInputBg,
                  borderRadius: 3,
                  boxShadow: themeColors.neoInset,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSvgIcon-root": { color: themeColors.textSecondary }
                }}
              >
                <MenuItem value={3000}>3 km (Close)</MenuItem>
                <MenuItem value={5000}>5 km (Standard)</MenuItem>
                <MenuItem value={10000}>10 km (Wide)</MenuItem>
                <MenuItem value={15000}>15 km (Regional)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 125 }}>
              <InputLabel sx={{ color: themeColors.textSecondary }}>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  color: themeColors.textPrimary,
                  backgroundColor: themeColors.neoInputBg,
                  borderRadius: 3,
                  boxShadow: themeColors.neoInset,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSvgIcon-root": { color: themeColors.textSecondary }
                }}
              >
                <MenuItem value="distance">Nearest First</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="category">Category</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
              <Tooltip title="Split Map & List View">
                <IconButton
                  onClick={() => setViewMode("split")}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "8px",
                    backgroundColor: viewMode === "split" ? "#2563eb" : themeColors.cardBg,
                    border: "none",
                    boxShadow: viewMode === "split" ? "none" : themeColors.neoRaisedSm,
                    color: viewMode === "split" ? "#ffffff" : themeColors.textSecondary,
                    transition: "all 0.2s ease"
                  }}
                >
                  <ViewSidebarIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Grid Cards View">
                <IconButton
                  onClick={() => setViewMode("grid")}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "8px",
                    backgroundColor: viewMode === "grid" ? "#2563eb" : themeColors.cardBg,
                    border: "none",
                    boxShadow: viewMode === "grid" ? "none" : themeColors.neoRaisedSm,
                    color: viewMode === "grid" ? "#ffffff" : themeColors.textSecondary,
                    transition: "all 0.2s ease"
                  }}
                >
                  <GridViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compact List View">
                <IconButton
                  onClick={() => setViewMode("list")}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "8px",
                    backgroundColor: viewMode === "list" ? "#2563eb" : themeColors.cardBg,
                    border: "none",
                    boxShadow: viewMode === "list" ? "none" : themeColors.neoRaisedSm,
                    color: viewMode === "list" ? "#ffffff" : themeColors.textSecondary,
                    transition: "all 0.2s ease"
                  }}
                >
                  <ViewListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            {Object.entries(CATEGORY_MAP).map(([key, item]) => {
              const isSelected = selectedCategory === key;
              return (
                <Chip
                  key={key}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => setSelectedCategory(key)}
                  variant={isSelected ? "filled" : "outlined"}
                  sx={{
                    fontWeight: 600,
                    fontSize: "12.5px",
                    height: 32,
                    px: 0.5,
                    borderRadius: "8px",
                    borderColor: isSelected ? item.color : themeColors.cardBorder,
                    backgroundColor: isSelected ? item.color : "transparent",
                    color: isSelected ? "#ffffff" : themeColors.textSecondary,
                    boxShadow: isSelected ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                    "& .MuiChip-icon": {
                      color: isSelected ? "#ffffff !important" : `${item.color} !important`
                    },
                    "&:hover": {
                      backgroundColor: isSelected ? item.color : (darkMode ? "#1e293b" : "#e0e7ff"),
                      transform: "translateY(-1px)"
                    },
                    transition: "all 0.2s ease"
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchPlaces}>
              Retry API
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={n}>
              <Card sx={{ borderRadius: 4, p: 2.5, backgroundColor: themeColors.cardBg, border: "none", boxShadow: themeColors.neoRaised }}>
                <Skeleton variant="text" width="60%" height={28} sx={{ bgcolor: darkMode ? "#1e293b" : "#d5dbe3", borderRadius: 2 }} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1, bgcolor: darkMode ? "#1e293b" : "#d5dbe3", borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, mb: 1.5, bgcolor: darkMode ? "#1e293b" : "#d5dbe3" }} />
                <Stack direction="row" justifyContent="space-between">
                  <Skeleton variant="rounded" width={80} height={24} sx={{ bgcolor: darkMode ? "#1e293b" : "#d5dbe3", borderRadius: 2 }} />
                  <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: darkMode ? "#1e293b" : "#d5dbe3" }} />
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredPlaces.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, backgroundColor: themeColors.cardBg, border: "none", boxShadow: themeColors.neoRaised }}>
          <ExploreIcon sx={{ fontSize: 60, color: themeColors.textSecondary, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: themeColors.textPrimary }}>
            No tourist sights found
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 2.5, maxWidth: 420, mx: "auto" }}>
            Try expanding your search radius or changing the category filter to discover more places near {currentCity.name}.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
              setRadiusMeters(10000);
            }}
          >
            Reset Filters & Expand Radius
          </Button>
        </Paper>
      ) : (
        <Box>
          {viewMode === "split" && (
            <Box sx={{ pl: { xs: 0, md: 2.5 } }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: themeColors.textSecondary }}>
                      FOUND {filteredPlaces.length} ATTRACTIONS NEAR {currentCity.name.toUpperCase()}
                    </Typography>

                    {filteredPlaces.map((place, idx) => {
                      const isBookmarked = itinerary.some((item) => item.id === place.id);
                      const isActive = activeMarkerId === place.id;

                      return (
                        <Card
                          key={place.id}
                          onClick={() => {
                            handleFocusPlace(place);
                            if (window.innerWidth < 900) {
                              setSelectedPlace(place);
                            }
                          }}
                          onTouchEnd={() => {
                            handleFocusPlace(place);
                            if (window.innerWidth < 900) {
                              setSelectedPlace(place);
                            }
                          }}
                          sx={{
                            borderRadius: 4,
                            border: "none",
                            backgroundColor: themeColors.cardBg,
                            boxShadow: isActive ? themeColors.neoInset : themeColors.neoRaisedSm,
                            transition: "all 0.25s ease",
                            cursor: "pointer",
                            "&:hover": {
                              boxShadow: themeColors.neoHover,
                              transform: "translateY(-2px)"
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ pr: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <Chip
                                    size="small"
                                    label={place.primaryCategory}
                                    sx={{
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      height: 22,
                                      backgroundColor: `${place.badgeColor}20`,
                                      color: place.badgeColor,
                                      border: `1px solid ${place.badgeColor}40`
                                    }}
                                  />
                                  {place.distKm != null && (
                                    <Typography variant="caption" sx={{ color: themeColors.textSecondary, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.3 }}>
                                      <WalkIcon sx={{ fontSize: 14 }} />
                                      {place.distKm} km
                                    </Typography>
                                  )}
                                </Stack>

                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: themeColors.textPrimary, lineHeight: 1.3 }}>
                                  {idx + 1}. {place.name}
                                </Typography>

                                <Typography variant="body2" sx={{ color: themeColors.textSecondary, fontSize: "12.5px", mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                  {place.description || place.address}
                                </Typography>
                              </Box>

                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title={isBookmarked ? "Remove from Itinerary" : "Add to Itinerary"}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => toggleBookmark(place, e)}
                                    color={isBookmarked ? "primary" : "default"}
                                    sx={{
                                      backgroundColor: isBookmarked ? (darkMode ? "#1e3a8a" : "#eff6ff") : "transparent",
                                      color: isBookmarked ? "#60a5fa" : themeColors.textSecondary
                                    }}
                                  >
                                    {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View Detailed Info">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPlace(place);
                                    }}
                                    onTouchEnd={(e) => {
                                      e.stopPropagation();
                                      setSelectedPlace(place);
                                    }}
                                    sx={{ color: themeColors.textSecondary }}
                                  >
                                    <LaunchIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{
                      position: "sticky",
                      top: 20,
                      height: { xs: 360, md: "calc(100vh - 120px)" },
                      minHeight: 400,
                      borderRadius: 4,
                      overflow: "hidden",
                      border: "none",
                      boxShadow: themeColors.neoInset
                    }}
                  >
                    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {viewMode === "grid" && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)"
                },
                gap: { xs: 2.5, sm: 3, md: 3.5 },
                alignItems: "stretch",
                px: { xs: 0.5, sm: 1 },
                py: 1
              }}
            >
              {filteredPlaces.map((place) => {
                const isBookmarked = itinerary.some((item) => item.id === place.id);
                return (
                  <Card
                    key={place.id}
                    onClick={() => setSelectedPlace(place)}
                    onTouchEnd={() => setSelectedPlace(place)}
                    sx={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 4,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      backgroundColor: themeColors.cardBg,
                      border: "none",
                      boxShadow: themeColors.neoRaised,
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: themeColors.neoHover
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                      <Box sx={{ height: 26, mb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Chip
                          size="small"
                          label={place.primaryCategory}
                          sx={{
                            fontSize: "11px",
                            fontWeight: 700,
                            height: 22,
                            backgroundColor: `${place.badgeColor}20`,
                            color: place.badgeColor
                          }}
                        />
                        {place.distKm != null && (
                          <Typography variant="caption" sx={{ color: themeColors.textSecondary, fontWeight: 600 }}>
                            📍 {place.distKm} km away
                          </Typography>
                        )}
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{
                          height: 44,
                          mb: 1,
                          fontWeight: 700,
                          fontSize: "16px",
                          lineHeight: 1.35,
                          color: themeColors.textPrimary,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {place.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          height: 56,
                          mb: 2,
                          color: themeColors.textSecondary,
                          fontSize: "13px",
                          lineHeight: 1.45,
                          flexGrow: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {place.description || place.address}
                      </Typography>

                      <Divider sx={{ my: 1.5, borderColor: themeColors.cardBorder, mt: "auto" }} />

                      <Box sx={{ height: 40, pt: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<LaunchIcon fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlace(place);
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                            setSelectedPlace(place);
                          }}
                          sx={{
                            height: 38,
                            minWidth: 165,
                            px: 2,
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "12px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            boxShadow: "none",
                            "&:hover": { backgroundColor: "#1d4ed8" }
                          }}
                        >
                          View Detailed Info
                        </Button>
                        <IconButton
                          size="small"
                          onClick={(e) => toggleBookmark(place, e)}
                          color={isBookmarked ? "primary" : "default"}
                          sx={{ width: 38, height: 38, borderRadius: "8px", color: isBookmarked ? "#2563eb" : themeColors.textSecondary }}
                        >
                          {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {viewMode === "list" && (
            <Stack spacing={2}>
              {filteredPlaces.map((place, idx) => {
                const isBookmarked = itinerary.some((item) => item.id === place.id);
                return (
                  <Paper
                    key={place.id}
                    elevation={0}
                    onClick={() => setSelectedPlace(place)}
                    onTouchEnd={() => setSelectedPlace(place)}
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      border: "none",
                      backgroundColor: themeColors.cardBg,
                      boxShadow: themeColors.neoRaisedSm,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      gap: 1.5,
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      "&:hover": { boxShadow: themeColors.neoHover, transform: "translateY(-1px)" }
                    }}
                  >
                    <Box sx={{ pr: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.3, flexWrap: "wrap" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeColors.textPrimary }}>
                          {idx + 1}. {place.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={place.primaryCategory}
                          sx={{ fontSize: "10px", height: 20, color: place.badgeColor, backgroundColor: `${place.badgeColor}20` }}
                        />
                      </Stack>
                      <Typography variant="caption" sx={{ color: themeColors.textSecondary }}>
                        📍 {place.address} {place.distKm != null ? `• ${place.distKm} km from center` : ""}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: "space-between" }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<LaunchIcon fontSize="small" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlace(place);
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          setSelectedPlace(place);
                        }}
                        sx={{
                          height: 38,
                          minWidth: 165,
                          px: 2,
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "12px",
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          boxShadow: "none",
                          "&:hover": { backgroundColor: "#1d4ed8" }
                        }}
                      >
                        View Detailed Info
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => toggleBookmark(place, e)}
                        color={isBookmarked ? "primary" : "default"}
                        sx={{ width: 38, height: 38, borderRadius: "8px", color: isBookmarked ? "#2563eb" : themeColors.textSecondary }}
                      >
                        {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                      </IconButton>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      )}

      {selectedPlace && (
        <Paper
          elevation={0}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            width: "100%",
            height: "100%",
            minHeight: "100%",
            overflowY: "auto",
            backgroundColor: themeColors.modalBg,
            color: themeColors.textPrimary,
            borderRadius: { xs: 0, sm: 4 },
            boxShadow: themeColors.neoHover,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Box
            sx={{
              p: 2.5,
              backgroundColor: "#1e3a8a",
              color: "white",
              position: "relative"
            }}
          >
            <Button
              size="small"
              startIcon={<CloseIcon />}
              onClick={() => setSelectedPlace(null)}
              sx={{
                height: 36,
                minWidth: 180,
                px: 2,
                color: "white",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                mb: 1.5,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" }
              }}
            >
              ← Back to Sights List
            </Button>

            <Box>
              <Chip
                size="small"
                label={selectedPlace.primaryCategory}
                sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700, mb: 1 }}
              />

              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {selectedPlace.name}
              </Typography>

              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {selectedPlace.city || currentCity.name}, {selectedPlace.country || currentCity.country}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: "100%",
                height: { xs: 180, sm: 220 },
                borderRadius: "16px",
                overflow: "hidden",
                mb: 2.5,
                boxShadow: themeColors.neoRaisedSm,
                border: `1px solid ${themeColors.cardBorder}`,
                backgroundImage: `url(${heroImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative"
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1.5,
                  background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                  📸 {selectedPlace.name}
                </Typography>
                <Chip
                  size="small"
                  label={selectedPlace.primaryCategory}
                  sx={{ backgroundColor: "#2563eb", color: "white", fontWeight: 700, height: 22, fontSize: "10px" }}
                />
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeColors.textSecondary, mb: 0.5 }}>
              ABOUT THIS ATTRACTION
            </Typography>
            <Typography variant="body1" sx={{ color: themeColors.textPrimary, lineHeight: 1.6, mb: 2 }}>
              {selectedPlace.description}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              startIcon={isSpeaking ? <VolumeOffIcon /> : <VolumeUpIcon />}
              onClick={() =>
                handleToggleSpeech(
                  `${selectedPlace.name}. ${selectedPlace.description}. Located at ${selectedPlace.address}`
                )
              }
              sx={{
                height: 40,
                minWidth: 230,
                px: 2,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                color: "#2563eb",
                borderColor: "#2563eb"
              }}
            >
              {isSpeaking ? "Pause Audio Narration" : "Listen to Audio Overview"}
            </Button>

            <Divider sx={{ my: 2, borderColor: themeColors.cardBorder }} />

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeColors.textSecondary }}>
                  ADDRESS
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontWeight: 500 }}>
                  📍 {selectedPlace.address}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeColors.textSecondary }}>
                  COORDINATES (LAT, LON)
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontFamily: "monospace" }}>
                    {selectedPlace.lat}, {selectedPlace.lon}
                  </Typography>
                  <IconButton size="small" onClick={() => copyCoordinates(selectedPlace.lat, selectedPlace.lon)} sx={{ color: themeColors.textSecondary }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>

              {selectedPlace.distKm != null && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeColors.textSecondary }}>
                    DISTANCE FROM CITY CENTER
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontWeight: 500 }}>
                    🚗 Approx. {selectedPlace.distKm} km
                  </Typography>
                </Box>
              )}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<NavigationIcon />}
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lon}`}
                target="_blank"
                sx={{
                  height: 42,
                  minWidth: 180,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: "#2563eb",
                  color: "#ffffff"
                }}
              >
                Open Directions
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={itinerary.some((i) => i.id === selectedPlace.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                onClick={(e) => toggleBookmark(selectedPlace, e)}
                sx={{
                  height: 42,
                  minWidth: 180,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#2563eb",
                  borderColor: "#2563eb"
                }}
              >
                {itinerary.some((i) => i.id === selectedPlace.id) ? "Saved in Itinerary" : "Add to Itinerary"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      <Drawer
        anchor="right"
        open={itineraryOpen}
        onClose={() => setItineraryOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            p: 3,
            backgroundColor: themeColors.bg,
            color: themeColors.textPrimary,
            borderLeft: "none"
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BookmarkIcon sx={{ color: "#2563eb" }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary }}>
              Day Trip Itinerary
            </Typography>
          </Stack>
          <IconButton onClick={() => setItineraryOpen(false)} sx={{ color: themeColors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 2 }}>
          Your custom sights list for {currentCity.name}. Total: {itinerary.length} stops.
        </Typography>

        {itinerary.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <ExploreIcon sx={{ fontSize: 48, color: themeColors.textSecondary, mb: 1, opacity: 0.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: themeColors.textSecondary }}>
              Your itinerary is empty
            </Typography>
            <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: "block", mb: 2 }}>
              Bookmark attractions by tapping the star or bookmark icon on any sight card.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }}>
            {itinerary.map((item, idx) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  border: "none",
                  backgroundColor: themeColors.cardBg,
                  boxShadow: themeColors.neoRaisedSm
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeColors.textPrimary }}>
                      {idx + 1}. {item.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: "block" }}>
                      📍 {item.distKm != null ? `${item.distKm} km away` : item.address}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={(e) => toggleBookmark(item, e)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {itinerary.length > 0 && (
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={copyItinerary}
              sx={{
                height: 42,
                minWidth: "100%",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                backgroundColor: "#2563eb",
                color: "#ffffff"
              }}
            >
              Export / Copy Itinerary
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={() => {
                setItinerary([]);
                setToastMessage("Cleared itinerary");
              }}
              sx={{
                height: 42,
                minWidth: "100%",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600
              }}
            >
              Clear All Stops
            </Button>
          </Stack>
        )}
      </Drawer>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            maxWidth: 450,
            width: "100%",
            borderRadius: 5,
            backgroundColor: themeColors.modalBg,
            border: "none",
            boxShadow: themeColors.neoHover,
            color: themeColors.textPrimary
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <KeyIcon sx={{ color: "#2563eb" }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: themeColors.textPrimary }}>
                API Configuration
              </Typography>
            </Stack>
            <IconButton onClick={() => setSettingsOpen(false)} sx={{ color: themeColors.textSecondary }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 2 }}>
            Provide your custom Geoapify Places API key if you'd like to use your own quota.
          </Typography>

          <TextField
            type="password"
            fullWidth
            size="small"
            label="Geoapify API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: themeColors.textPrimary,
                backgroundColor: themeColors.neoInputBg,
                borderRadius: 3,
                boxShadow: themeColors.neoInset,
                "& fieldset": { border: "none" }
              },
              "& .MuiInputLabel-root": { color: themeColors.textSecondary }
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setSettingsOpen(false);
              fetchPlaces();
              setToastMessage("API key saved & data refreshed!");
            }}
            sx={{
              height: 42,
              minWidth: "100%",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: "#2563eb",
              color: "#ffffff"
            }}
          >
            Save & Refresh Data
          </Button>
        </Paper>
      </Modal>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToastMessage("")} severity="success" sx={{ width: "100%", borderRadius: 2 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}