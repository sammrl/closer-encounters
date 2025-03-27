import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import './App.css';
import ParticleBackground from './components/ParticleBackground';
import TimePeriodFilter, { TIME_PERIODS, TimePeriodKey } from './components/TimePeriodFilter';
import TimeSlider from './components/TimeSlider';
import { LoadingProgress, ColorScheme } from './types';

// Custom SVG icons for each category
const SVG_ICONS = {
  confirmed: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
  </svg>`,
  probable: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor"/>
    <path d="M12 17a5 5 0 100-10 5 5 0 000 10z" fill="currentColor"/>
  </svg>`,
  possible: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor"/>
  </svg>`
};

// Custom pulsing ring SVG for hover effect
const createPulsingRing = (color: string) => `
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="pulsing-ring">
    <circle cx="40" cy="40" r="20" stroke="${color}" stroke-width="2" fill="none" />
    <circle cx="40" cy="40" r="30" stroke="${color}" stroke-width="1.5" stroke-opacity="0.7" fill="none" />
    <circle cx="40" cy="40" r="40" stroke="${color}" stroke-width="1" stroke-opacity="0.5" fill="none" />
    <style>
      .pulsing-ring circle {
        transform-origin: center;
        animation: pulse 2s ease-out infinite;
      }
      .pulsing-ring circle:nth-child(2) {
        animation-delay: 0.5s;
      }
      .pulsing-ring circle:nth-child(3) {
        animation-delay: 1s;
      }
      @keyframes pulse {
        0% { transform: scale(0.5); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: scale(1.2); opacity: 0; }
      }
    </style>
  </svg>
`;

// Dynamic data visualization rings for the points
const createDataRings = (category: string, credibility: number = 5) => {
  const color = COLOR_SCHEME[category as keyof typeof COLOR_SCHEME];
  const segments = Math.max(3, Math.round(credibility / 2));
  let paths = '';
  
  for (let i = 0; i < segments; i++) {
    const rotation = (i * 360 / segments);
    const opacity = 0.7 + (i / segments * 0.3);
    paths += `<path d="M 40,40 m 0,-30 a 30,30 0 0,1 0,60 a 30,30 0 0,1 0,-60" 
              stroke="${color}" 
              stroke-width="${1.5 + i * 0.5}" 
              stroke-dasharray="${20 + i * 5} ${100 - i * 10}" 
              stroke-opacity="${opacity}" 
              fill="none" 
              transform="rotate(${rotation}, 40, 40)" />`;
  }
  
  return `
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="data-rings">
      ${paths}
      <circle cx="40" cy="40" r="5" fill="${color}" />
      <style>
        .data-rings path {
          transform-origin: center;
          animation: rotate 10s linear infinite;
        }
        .data-rings path:nth-child(odd) {
          animation-direction: reverse;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    </svg>
  `;
};

// Dynamic pulse animation parameters
const PULSE_ANIMATION = {
  duration: 1500,
  minScale: 0.8,
  maxScale: 1.4
};

// Ambient particle system
interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  alpha: number;
}

// Define marker structure according to react-globe.gl requirements
interface GlobeMarker {
  id: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  category: 'confirmed' | 'probable' | 'possible';
  // Additional custom fields
  title: string;
  date: string;
  year?: number;
  location: string;
  region?: string;
  country?: string;
  credibility?: number;
  description?: string;
}

// For handling large datasets
interface LoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

// Define color scheme - sci-fi colors
const COLOR_SCHEME = {
  confirmed: '#6ee7ff', // cyan/blue
  probable: '#ff7b3d',  // orange
  possible: '#65fc78'   // green
};

// Function to load multiple JSON files
const loadJSONFiles = async (
  fileUrls: string[],
  progressCallback?: (progress: number) => void
): Promise<any[]> => {
  const allData: any[] = [];
  const total = fileUrls.length;
  
  // Process in smaller batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < fileUrls.length; i += batchSize) {
    const batchUrls = fileUrls.slice(i, i + batchSize);
    
    // Load batch in parallel
    const batchPromises = batchUrls.map(url => 
      fetch(url).then(res => res.json())
    );
    
    const batchResults = await Promise.all(batchPromises);
    allData.push(...batchResults);
    
    // Update progress
    if (progressCallback) {
      progressCallback(Math.min((i + batchSize) / total, 1));
    }
  }
  
  return allData;
};

// Convert generic JSON data to GlobeMarker format
const convertToGlobeMarkers = (jsonData: any[]): GlobeMarker[] => {
  return jsonData.map((data, index) => {
    // Extract lat/lng - handle different possible field names
    const lat = parseFloat(data.latitude || data.lat || data.y || data.location?.coordinates?.[1]);
    const lng = parseFloat(data.longitude || data.lng || data.x || data.location?.coordinates?.[0]);
    
    // Skip if coordinates are invalid
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.warn(`Invalid coordinates in data point ${index}:`, data);
      return null;
    }
    
    // Map category to one of the three required types
    let category: 'confirmed' | 'probable' | 'possible';
    if (data.category) {
      const cat = String(data.category).toLowerCase();
      if (cat.includes('confirm') || cat.includes('validated')) {
        category = 'confirmed';
      } else if (cat.includes('prob') || cat.includes('likely')) {
        category = 'probable';
      } else {
        category = 'possible';
      }
    } else {
      category = 'possible'; // Default
    }
    
    // Extract year from date if available
    let year: number | undefined;
    if (data.date) {
      const dateStr = String(data.date);
      // Try to extract year with regex
      const yearMatch = dateStr.match(/\b(1[0-9]{3}|2[0-9]{3}|[0-9]{1,3}(?:\s?(?:BC|BCE|AD|CE)))\b/i);
      if (yearMatch) {
        const yearStr = yearMatch[1].toLowerCase();
        if (yearStr.includes('bc') || yearStr.includes('bce')) {
          // For BC/BCE dates, make them negative
          year = -parseInt(yearStr.replace(/\D/g, ''), 10);
        } else {
          year = parseInt(yearStr.replace(/\D/g, ''), 10);
        }
      } else {
        // Try to parse as a date object
        try {
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            year = dateObj.getFullYear();
          }
        } catch (e) {
          // Parsing failed, year remains undefined
        }
      }
    }
    
    return {
      id: data.id || `point-${index}`,
      lat,
      lng,
      size: 1.0,
      color: COLOR_SCHEME[category],
      category,
      title: data.title || data.name || `Data Point ${index + 1}`,
      date: data.date || data.timestamp || 'Unknown',
      year,
      location: data.address || data.place || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      region: data.region || data.area || '',
      country: data.country || '',
      credibility: typeof data.credibility === 'number' ? data.credibility : 5,
      description: data.description || data.notes || data.details || 'No description available'
    };
  }).filter(Boolean) as GlobeMarker[];
};

const App: React.FC = () => {
  const globeEl = useRef<any>(null);
  const [markers, setMarkers] = useState<GlobeMarker[]>([]);
  const [filteredMarkers, setFilteredMarkers] = useState<GlobeMarker[]>([]);
  const [timelineMarkers, setTimelineMarkers] = useState<GlobeMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [hoveredMarker, setHoveredMarker] = useState<GlobeMarker | null>(null);
  const [hoveredCoordinates, setHoveredCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [activePeriod, setActivePeriod] = useState<TimePeriodKey | null>(null);
  const [timelineYear, setTimelineYear] = useState<number>(1950);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);
  const [timelineYearRange, setTimelineYearRange] = useState<[number, number]>([-3000, new Date().getFullYear()]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timelineIntervalRef = useRef<number | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    error: null
  });

  // Track mouse position for hover effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Load data from JSON files or API
  const loadData = useCallback(async (dataSource: string | string[]) => {
    try {
      setLoading({
        isLoading: true,
        progress: 0,
        error: null
      });
      
      let jsonData: any[] = [];
      
      // Handle different data source types
      if (Array.isArray(dataSource)) {
        // Array of file URLs
        jsonData = await loadJSONFiles(dataSource, (progress) => {
          setLoading(prev => ({
            ...prev,
            progress
          }));
        });
      } else if (dataSource.startsWith('http')) {
        // Single API endpoint
        const response = await fetch(dataSource);
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const responseData = await response.json();
        
        // Handle both array and object responses
        if (!Array.isArray(responseData) && responseData.data && Array.isArray(responseData.data)) {
          jsonData = responseData.data;
        } else {
          jsonData = Array.isArray(responseData) ? responseData : [responseData];
        }
      } else if (dataSource.endsWith('.json')) {
        // Single local JSON file
        const response = await fetch(dataSource);
        jsonData = await response.json();
      } else {
        throw new Error(`Unsupported data source: ${dataSource}`);
      }
      
      // Convert to GlobeMarker format
      const convertedMarkers = convertToGlobeMarkers(jsonData);
      
      console.log(`Loaded ${convertedMarkers.length} valid data points from ${jsonData.length} records`);
      setMarkers(convertedMarkers);
      
      setLoading({
        isLoading: false,
        progress: 1,
        error: null
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading({
        isLoading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error loading data'
      });
      
      // Fall back to sample data
      generateSampleData();
    }
  }, []);

  // Function to generate sample data
  const generateSampleData = useCallback(() => {
    // UFO shapes for more consistent data
    const ufoShapes = ['cigar-shaped', 'disc-shaped', 'triangular', 'spherical', 'oval', 'saucer-shaped', 'boomerang-shaped', 'black triangle'];
    
    // Major cities with accurate coordinates
    const majorCities = [
      // North America
      { name: 'New York', country: 'USA', region: 'East Coast', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles', country: 'USA', region: 'West Coast', lat: 34.0522, lng: -118.2437 },
      { name: 'Chicago', country: 'USA', region: 'Midwest', lat: 41.8781, lng: -87.6298 },
      { name: 'Houston', country: 'USA', region: 'South', lat: 29.7604, lng: -95.3698 },
      { name: 'Phoenix', country: 'USA', region: 'Southwest', lat: 33.4484, lng: -112.0740 },
      { name: 'Toronto', country: 'Canada', region: 'Ontario', lat: 43.6532, lng: -79.3832 },
      { name: 'Mexico City', country: 'Mexico', region: 'Mexico City', lat: 19.4326, lng: -99.1332 },
      
      // South America
      { name: 'Rio de Janeiro', country: 'Brazil', region: 'Southeast', lat: -22.9068, lng: -43.1729 },
      { name: 'Buenos Aires', country: 'Argentina', region: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
      { name: 'Lima', country: 'Peru', region: 'Lima', lat: -12.0464, lng: -77.0428 },
      
      // Europe
      { name: 'London', country: 'UK', region: 'England', lat: 51.5074, lng: -0.1278 },
      { name: 'Paris', country: 'France', region: 'Île-de-France', lat: 48.8566, lng: 2.3522 },
      { name: 'Berlin', country: 'Germany', region: 'Berlin', lat: 52.5200, lng: 13.4050 },
      { name: 'Rome', country: 'Italy', region: 'Lazio', lat: 41.9028, lng: 12.4964 },
      { name: 'Madrid', country: 'Spain', region: 'Madrid', lat: 40.4168, lng: -3.7038 },
      { name: 'Moscow', country: 'Russia', region: 'Central', lat: 55.7558, lng: 37.6173 },
      
      // Asia
      { name: 'Tokyo', country: 'Japan', region: 'Kanto', lat: 35.6762, lng: 139.6503 },
      { name: 'Beijing', country: 'China', region: 'Beijing', lat: 39.9042, lng: 116.4074 },
      { name: 'Shanghai', country: 'China', region: 'Shanghai', lat: 31.2304, lng: 121.4737 },
      { name: 'Mumbai', country: 'India', region: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
      { name: 'Delhi', country: 'India', region: 'Delhi', lat: 28.7041, lng: 77.1025 },
      { name: 'Seoul', country: 'South Korea', region: 'Seoul', lat: 37.5665, lng: 126.9780 },
      
      // Africa
      { name: 'Cairo', country: 'Egypt', region: 'Cairo Governorate', lat: 30.0444, lng: 31.2357 },
      { name: 'Lagos', country: 'Nigeria', region: 'Lagos', lat: 6.5244, lng: 3.3792 },
      { name: 'Johannesburg', country: 'South Africa', region: 'Gauteng', lat: -26.2041, lng: 28.0473 },
      { name: 'Nairobi', country: 'Kenya', region: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      
      // Oceania
      { name: 'Sydney', country: 'Australia', region: 'New South Wales', lat: -33.8688, lng: 151.2093 },
      { name: 'Melbourne', country: 'Australia', region: 'Victoria', lat: -37.8136, lng: 144.9631 },
      { name: 'Auckland', country: 'New Zealand', region: 'Auckland', lat: -36.8509, lng: 174.7645 }
    ];
    
    // Generate a large number of sightings for a sci-fi look
    const generateSightings = (count: number, useRandomLocations = false) => {
      return Array(count).fill(0).map((_, i) => {
        // Select or generate a location
        let location;
        
        if (!useRandomLocations && i < majorCities.length) {
          // Use major cities
          location = majorCities[i % majorCities.length];
        } else {
          // Generate random location - concentrate more on land masses
          // This is a simplified approach - better would be to use actual land-only coordinates
          const lat = (Math.random() * 140 - 70); // -70 to 70 degrees latitude
          const lng = (Math.random() * 360 - 180); // -180 to 180 degrees longitude
          location = {
            name: `Location ${i}`,
            country: 'Unknown',
            region: 'Unknown',
            lat,
            lng
          };
        }
        
        // Add some minor randomness to exact coordinates to create clusters
        const latOffset = (Math.random() - 0.5) * 3;
        const lngOffset = (Math.random() - 0.5) * 3;
        
        // Generate a random year from 1950 to 2023
        const year = Math.floor(Math.random() * 5023) - 3000; // Range from -3000 to 2023 to cover all time periods
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(Math.max(1, year), month, day); // Ensure date is valid
        
        // Determine the category based on credibility
        const credibility = Math.floor(Math.random() * 10) + 1;
        let category: 'confirmed' | 'probable' | 'possible';
        
        if (credibility >= 8) {
          category = 'confirmed';
        } else if (credibility >= 5) {
          category = 'probable';
        } else {
          category = 'possible';
        }
        
        // Use a uniform size for all markers for sci-fi coherence
        const size = 1.0; 
        
        // UFO shape
        const ufoShape = ufoShapes[Math.floor(Math.random() * ufoShapes.length)];
        
        // Generate description
        const timeOfDay = ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)];
        const duration = Math.floor(Math.random() * 30) + 1;
        const witnesses = Math.floor(Math.random() * 20) + 1;
        
        return {
          id: `sighting-${i}`,
          lat: location.lat + latOffset,
          lng: location.lng + lngOffset,
          size,
          color: COLOR_SCHEME[category],
          category,
          title: `UFO Sighting ${category === 'confirmed' ? '(Confirmed)' : 
                            category === 'probable' ? '(Probable)' : '(Possible)'}`,
          date: date.toLocaleDateString(),
          year, // Add the year
          credibility,
          location: location.name,
          region: location.region,
          country: location.country,
          description: `This ${ufoShape} object was spotted in the ${timeOfDay} and observed for approximately ${duration} minutes by ${witnesses} witnesses. The object ${
            category === 'confirmed' 
              ? 'was tracked on multiple radar systems and confirmed by military personnel.' 
              : category === 'probable'
                ? 'was photographed clearly and witnessed by multiple credible observers.'
                : 'was reported by a small number of witnesses with no physical evidence.'
          }`
        };
      });
    };
    
    // Generate 500 random sightings for a sci-fi data-rich appearance
    const citySightings = generateSightings(majorCities.length);
    const randomSightings = generateSightings(470, true);
    const allSightings = [...citySightings, ...randomSightings];
    
    setMarkers(allSightings);
  }, []);

  // Generate sample data
  useEffect(() => {
    // Function to fetch and process JSON data files
    const loadJsonDataset = async () => {
      try {
        // Example of loading from a data directory with individual JSON files
        // const dataFiles = Array.from({ length: 1000 }, (_, i) => `/data/sighting-${i + 1}.json`);
        // await loadData(dataFiles);
        
        // Example of loading from a single API endpoint
        // await loadData('/api/sightings');
        
        // Since we don't have real data yet, generate sample data
        generateSampleData();
      } catch (error) {
        console.error('Error loading JSON data:', error);
        // Fallback to sample data if loading fails
        generateSampleData();
      }
    };
    
    // Load real or sample data
    loadJsonDataset();
  }, [loadData]);
  
  // Auto-rotate
  useEffect(() => {
    // Wait for the globe to be initialized
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.15;
      
      // Make the globe a bit further away on load
      globeEl.current.pointOfView({ altitude: 2.5 }, 0);
    }
  }, []);
  
  // Enhanced tooltip content function
  const getTooltipContent = useCallback((marker: GlobeMarker) => {
    // Different color for each category
    const titleColor = marker.category === 'confirmed' ? COLOR_SCHEME.confirmed : 
                      marker.category === 'probable' ? COLOR_SCHEME.probable : 
                      COLOR_SCHEME.possible;
    
    // Format date nicely if it's a date string
    let formattedDate = marker.date;
    if (formattedDate.includes('/')) {
      try {
        const date = new Date(marker.date);
        formattedDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } catch (e) {
        // Use the original date if parsing fails
      }
    }
    
    // Get icon for category
    const categoryIcon = SVG_ICONS[marker.category];
    
    return `
      <div class="globe-tooltip" id="tooltip-${marker.id}">
        <div class="globe-tooltip-title" style="text-shadow: 0 0 10px ${titleColor}40;">
          ${marker.title}
        </div>
        
        <div class="globe-tooltip-meta">
          <div style="opacity: 0.9;">${formattedDate}</div>
          <div style="color: ${titleColor}; display: flex; align-items: center;">
            <span style="margin-right: 4px; color: ${titleColor}">
              ${categoryIcon}
            </span>
            ${marker.category.charAt(0).toUpperCase() + marker.category.slice(1)}
          </div>
        </div>
        
        <div style="font-size: 13px; line-height: 1.4; color: rgba(255, 255, 255, 0.8);">
          ${marker.location}${marker.region ? `, ${marker.region}` : ''}${marker.country ? `, ${marker.country}` : ''}
        </div>
        
        <div class="globe-tooltip-footer">
          <div style="color: rgba(203, 213, 225, 0.7);">
            ${marker.lat.toFixed(2)}°, ${marker.lng.toFixed(2)}°
          </div>
          <div class="globe-tooltip-btn">
            Details
            <span class="globe-tooltip-icon">→</span>
          </div>
        </div>
        
        <div class="globe-tooltip-pulse"></div>
      </div>
    `;
  }, []);
  
  // Handle point hover
  const handlePointHover = useCallback((marker: any) => {
    if (!marker) {
      // Mouse left the point, resume rotation if no modal is open
      if (!showModal && globeEl.current) {
        globeEl.current.controls().autoRotate = true;
      }
      setHoveredMarker(null);
      setHoveredCoordinates(null);
      return;
    }
    
    // Mouse entered the point, pause rotation
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }
    const typedMarker = marker as GlobeMarker;
    setHoveredMarker(typedMarker);
    setHoveredCoordinates({
      lat: typedMarker.lat,
      lng: typedMarker.lng
    });
  }, [showModal]);
  
  const handleMarkerClick = useCallback((marker: any, event?: MouseEvent) => {
    const typedMarker = marker as GlobeMarker;
    setSelectedMarker(typedMarker);
    setShowModal(true);
    
    // Important: stop propagation to prevent the globe from resetting/spinning
    // when interacting with the marker
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
      
      // Focus the globe on the selected marker
      globeEl.current.pointOfView({
        lat: typedMarker.lat,
        lng: typedMarker.lng,
        altitude: 0.5
      }, 1000);
    }
  }, []);
  
  const handleCloseModal = () => {
    setShowModal(false);
    
    // Resume auto-rotation when modal is closed
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
    }
  };

  // Create a function to setup the playback interval with current parameters
  const setupPlaybackInterval = useCallback(() => {
    // Clear any existing interval first
    if (timelineIntervalRef.current) {
      window.clearInterval(timelineIntervalRef.current);
      timelineIntervalRef.current = null;
    }
    
    // Calculate year increment based on timeline range and playback speed
    const totalYears = timelineYearRange[1] - timelineYearRange[0];
    // Use larger increments for large time ranges to speed through ancient history
    const baseYearIncrement = totalYears > 4000 ? 20 : 
                          totalYears > 2000 ? 10 : 
                          totalYears > 1000 ? 5 : 2;
    
    // Apply speed factor to the base increment
    const yearIncrement = Math.max(1, Math.round(baseYearIncrement * playbackSpeed));
    
    // Adjust interval based on speed (faster speed = shorter interval)
    const intervalTime = Math.max(50, Math.round(300 / playbackSpeed));
    
    // Set new interval to advance the year
    timelineIntervalRef.current = window.setInterval(() => {
      setTimelineYear(prevYear => {
        // If we reached the end of the timeline, stop playing
        if (prevYear >= timelineYearRange[1]) {
          setIsTimelinePlaying(false);
          return timelineYearRange[1];
        }
        
        // Move more quickly through ancient periods, then slow down for modern periods
        if (prevYear < 1800) {
          return prevYear + yearIncrement;
        } else if (prevYear < 1950) {
          return prevYear + Math.max(1, Math.floor(yearIncrement / 2));
        } else {
          return prevYear + Math.max(1, Math.floor(yearIncrement / 3)); // Slower for contemporary period
        }
      });
    }, intervalTime);
  }, [playbackSpeed, timelineYearRange]);

  // When the timeline is playing or speed changes, update the interval
  useEffect(() => {
    if (isTimelinePlaying) {
      setupPlaybackInterval();
    } else {
      // Stop the interval when not playing
      if (timelineIntervalRef.current) {
        window.clearInterval(timelineIntervalRef.current);
        timelineIntervalRef.current = null;
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      if (timelineIntervalRef.current) {
        window.clearInterval(timelineIntervalRef.current);
      }
    };
  }, [isTimelinePlaying, setupPlaybackInterval]);
  
  // Timeline play/pause toggle
  const handleTimelinePlayToggle = useCallback(() => {
    setIsTimelinePlaying(prev => !prev);
  }, []);

  // Update timeline year with a buffer to avoid too frequent updates
  const handleTimelineYearChange = useCallback((year: number) => {
    setTimelineYear(year);
  }, []);
  
  // Handle playback speed change
  const handleSpeedChange = useCallback((speedFactor: number) => {
    setPlaybackSpeed(speedFactor);
    
    // If currently playing, update the interval immediately with new speed
    if (isTimelinePlaying && timelineIntervalRef.current) {
      setupPlaybackInterval();
    }
  }, [isTimelinePlaying, setupPlaybackInterval]);

  // Filter markers based on the timeline year when in timeline mode
  useEffect(() => {
    if (activePeriod !== null) {
      // When a time period is selected, use the period filter
      const period = TIME_PERIODS[activePeriod];
      const [minYear, maxYear] = period.range;
      
      const filtered = markers.filter(marker => {
        if (marker.year === undefined) {
          return false; // Skip markers without a year
        }
        return marker.year >= minYear && marker.year <= maxYear;
      });
      
      setFilteredMarkers(filtered);
      setTimelineMarkers([]); // Clear timeline markers when using period filter
    } else {
      // When no period is selected, we use the timeline
      // For the regular filtered markers, show all markers in the base set
      // This will ensure that markers that don't have a year still show up
      setFilteredMarkers([]);
      
      // For timeline, only include markers up to the current year that have a valid year
      const timelineFiltered = markers.filter(marker => {
        // Must have a year to be included in timeline
        if (marker.year === undefined) {
          return false;
        }
        
        // Include only markers from this year or earlier
        return marker.year <= timelineYear;
      });
      
      setTimelineMarkers(timelineFiltered);
    }
  }, [activePeriod, markers, timelineYear]);

  // Calculate the min and max years from the dataset
  useEffect(() => {
    if (markers.length > 0) {
      // Find the minimum and maximum years
      let minYear = Number.MAX_SAFE_INTEGER;
      let maxYear = Number.MIN_SAFE_INTEGER;
      
      markers.forEach(marker => {
        if (marker.year !== undefined) {
          minYear = Math.min(minYear, marker.year);
          maxYear = Math.max(maxYear, marker.year);
        }
      });
      
      // Only update if we found valid min/max years
      if (minYear !== Number.MAX_SAFE_INTEGER && maxYear !== Number.MIN_SAFE_INTEGER) {
        setTimelineYearRange([minYear, maxYear]);
        
        // Set the timeline to start at 1950 or the minimum year, whichever is later
        setTimelineYear(Math.max(minYear, 1950));
      }
    }
  }, [markers]);

  // Handle period selection
  const handlePeriodSelect = useCallback((period: string | null) => {
    setActivePeriod(period as TimePeriodKey | null);
    
    // Stop timeline when switching to a period filter
    if (period !== null && isTimelinePlaying) {
      setIsTimelinePlaying(false);
    }
  }, [isTimelinePlaying]);

  // Using useMemo to avoid unnecessary re-renders as per REACTGLOBEDOCS.md
  const globeOptions = useMemo(() => ({
    // Point configuration - using standard points with sci-fi styling
    pointsData: activePeriod === null ? timelineMarkers : filteredMarkers, // Use timeline markers when no period filter is active
    pointAltitude: 0.01,
    pointColor: (d: any) => {
      const marker = d as GlobeMarker;
      
      // When in timeline mode and not using period filter, add a fade effect to recent sightings
      if (activePeriod === null && marker.year !== undefined && timelineMarkers.length > 0) {
        // Create fade effect based on year proximity to current timeline year
        const yearDiff = timelineYear - marker.year;
        
        // Points from the current year are full opacity, older points fade out slightly
        if (yearDiff <= 0) {
          // Brighten current year points 
          return marker.color;
        } else if (yearDiff < 20) {
          // Recent points (within 20 years) fade slightly
          const opacity = Math.max(0.8, 1 - (yearDiff / 50));
          const color = marker.color;
          
          // Parse the RGB values from the hex color
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        } else {
          // Older points still visible but slightly faded
          const color = marker.color;
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          return `rgba(${r}, ${g}, ${b}, 0.8)`;
        }
      }
      
      return marker.color;
    },
    pointRadius: (d: any) => {
      const marker = d as GlobeMarker;
      
      // When in timeline mode, make recent points larger
      if (activePeriod === null && marker.year !== undefined && timelineMarkers.length > 0) {
        const yearDiff = timelineYear - marker.year;
        
        // Current year points are larger
        if (yearDiff === 0) {
          return marker.category === 'confirmed' ? 0.45 : 
                 marker.category === 'probable' ? 0.4 : 0.35;
        } else if (yearDiff < 10) {
          // Recent points (within 10 years) are slightly larger
          return marker.category === 'confirmed' ? 0.4 : 
                 marker.category === 'probable' ? 0.35 : 0.3;
        }
      }
      
      return marker.category === 'confirmed' ? 0.35 : 
             marker.category === 'probable' ? 0.3 : 0.25;
    },
    pointsMerge: false,
    pointsTransitionDuration: activePeriod === null ? 300 : 800, // Faster transitions for timeline mode
    
    // Enhanced glow effect
    pointGlow: (d: any) => {
      const marker = d as GlobeMarker;
      // Extra glow effect for markers from the current timeline year
      if (activePeriod === null && timelineMarkers.length > 0 && marker.year === timelineYear) {
        return true;
      }
      return true; // Always use glow effect
    },
    pointAltitudeScale: (d: any) => {
      const marker = d as GlobeMarker;
      // Higher altitude scale for current year markers in timeline mode
      if (activePeriod === null && timelineMarkers.length > 0 && marker.year === timelineYear) {
        return 0.25; // Larger glow for current year markers
      }
      return 0.15; // Normal glow for other markers
    },
    pointLabel: (d: any) => getTooltipContent(d as GlobeMarker),
    
    // Premium Earth textures
    globeImageUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
    bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
    backgroundImageUrl: '',
    backgroundColor: 'rgba(0,0,0,0)',
    
    // Enhanced globe appearance
    globeGlowCoefficient: 0.12,
    globeGlowColor: '#123663',
    globeGlowPower: 5,
    globeGlowRadiusScale: 0.45,
    
    // Atmosphere
    atmosphereColor: '#2a3f6a',
    atmosphereAltitude: 0.2,
    
    // Custom rings
    ringsData: [
      {lng: 0, lat: 0, radius: 1.5, color: 'rgba(59, 130, 246, 0.1)'}
    ],
    ringColor: (d: any) => d.color,
    ringMaxRadius: 'radius',
    ringPropagationSpeed: 3,
    ringRepeatPeriod: 1500,
    
    // Controls
    enableZoom: true,
    zoomSpeed: 3.0,
    enablePan: false,
    enableRotate: true,
    rotateSpeed: 0.6,
    
    // Animation
    animateIn: true
  }), [filteredMarkers, getTooltipContent]);
  
  return (
    <div className="globe-container" style={{ backgroundColor: '#030618' }}>
      <ParticleBackground 
        particleColors={['#ffffff', '#e3f2ff', '#fffce0', '#cbe8ff']}
        particleCount={100}
        maxSpeed={0.15}
        connectParticles={true}
        lineColor="rgba(180, 230, 255, 0.3)"
        lineWidth={1.5}
        maxSize={2.5}
      />
      
      <Globe
        ref={globeEl}
        height={window.innerHeight}
        width={window.innerWidth}
        
        // Use normal globe click handler to reset auto-rotate
        onGlobeClick={() => {
          if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
          }
        }}
        
        // Handle point clicks
        onPointClick={handleMarkerClick}
        
        // Handle point hover to pause/resume rotation
        onPointHover={handlePointHover}
        
        // Apply all globe options
        {...globeOptions}
      />
      
      {/* Time Period Filter */}
      <TimePeriodFilter 
        activePeriod={activePeriod} 
        onSelectPeriod={handlePeriodSelect} 
      />
      
      {/* Hover indicator ring - now positioned relative to the mouse instead of trying to calculate position */}
      {hoveredMarker && (
        <div 
          className="fixed pointer-events-none z-10 w-20 h-20"
          style={{
            // Position it at the mouse cursor when hovering
            left: `calc(${mousePosition.x}px - 40px)`,
            top: `calc(${mousePosition.y}px - 40px)`,
          }}
          dangerouslySetInnerHTML={{
            __html: createPulsingRing(hoveredMarker.color)
          }}
        />
      )}
      
      {/* Removed floating Recent Sighting Indicators */}
      
      {/* Circular Analytics Panel */}
      {!activePeriod && (
        <div className="circular-analytics">
          <div className="circular-analytics-inner">
            <div className="analytics-value">
              {timelineMarkers.length > 0 ? timelineMarkers.length : markers.length}
            </div>
            <div className="analytics-label">
              {timelineMarkers.length > 0 ? `SIGHTINGS BY ${timelineYear}` : "TOTAL SIGHTINGS"}
            </div>
            
            <div className="analytics-breakdown">
              {Object.entries(COLOR_SCHEME).map(([category, color]) => {
                const dataSet = timelineMarkers.length > 0 ? timelineMarkers : markers;
                const count = dataSet.filter(m => m.category === category).length;
                const percentage = dataSet.length > 0 
                  ? (count / dataSet.length * 100).toFixed(1) 
                  : "0.0";
                
                return (
                  <div key={category} className="analytics-category">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                      <div className="text-sm font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</div>
                      <div className="text-xs ml-auto opacity-70">{percentage}%</div>
                    </div>
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: color,
                          boxShadow: `0 0 8px ${color}`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {timelineMarkers.length > 0 && (
              <div className="mt-4 text-xs text-gray-400">
                {Math.round((timelineMarkers.length / markers.length) * 100)}% of total sightings
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Circular Analytics Panel - Period Specific */}
      {activePeriod && (
        <div className="circular-analytics">
          <div className="circular-analytics-inner">
            <div className="analytics-value">{filteredMarkers.length}</div>
            <div className="analytics-label">
              SIGHTINGS IN PERIOD
            </div>
            
            <div className="analytics-breakdown">
              {Object.entries(COLOR_SCHEME).map(([category, color]) => {
                const count = filteredMarkers.filter(m => m.category === category).length;
                const percentage = filteredMarkers.length > 0 
                  ? (count / filteredMarkers.length * 100).toFixed(1) 
                  : "0.0";
                
                return (
                  <div key={category} className="analytics-category">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                      <div className="text-sm font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</div>
                      <div className="text-xs ml-auto opacity-70">{percentage}%</div>
                    </div>
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: color,
                          boxShadow: `0 0 8px ${color}`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Timeline Slider - only visible when no period filter is active */}
      <TimeSlider 
        minYear={timelineYearRange[0]}
        maxYear={timelineYearRange[1]}
        currentYear={timelineYear}
        onChange={handleTimelineYearChange}
        isPlaying={isTimelinePlaying}
        onPlayToggle={handleTimelinePlayToggle}
        showAllSightings={activePeriod === null}
        playbackSpeed={playbackSpeed}
        onSpeedChange={handleSpeedChange}
      />
      
      {/* Loading indicator */}
      {loading.isLoading && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black bg-opacity-60">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-400"></div>
          <div className="mt-4 text-blue-300 font-semibold">
            Loading data ({Math.round(loading.progress * 100)}%)
          </div>
        </div>
      )}
      
      {/* Error message */}
      {loading.error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-red-900 bg-opacity-90 text-white p-4 rounded-lg shadow-lg">
          <div className="font-bold mb-1">Error loading data</div>
          <div>{loading.error}</div>
          <button 
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
            onClick={() => setLoading(prev => ({ ...prev, error: null }))}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Modal for sighting details */}
      {showModal && selectedMarker && (
        <div 
          className="globe-modal-overlay"
          onClick={handleCloseModal}
        >
          <div 
            className="globe-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="globe-modal-header">
              <div className="globe-modal-title">
                {selectedMarker.title}
              </div>
              <button className="globe-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <div className="globe-modal-content">
              {/* Date & Location */}
              <div className="data-card">
                <div className="data-card-header" style={{ color: selectedMarker.color }}>Date & Location</div>
                <div className="data-field">
                  <div className="data-field-label">Date</div>
                  <div className="data-field-value">{selectedMarker.date}</div>
                </div>
                <div className="data-field">
                  <div className="data-field-label">Location</div>
                  <div className="data-field-value">{selectedMarker.location}</div>
                </div>
                <div className="data-field">
                  <div className="data-field-label">Region</div>
                  <div className="data-field-value">{selectedMarker.region || 'Unknown'}</div>
                </div>
                <div className="data-field">
                  <div className="data-field-label">Country</div>
                  <div className="data-field-value">{selectedMarker.country || 'Unknown'}</div>
                </div>
                <div className="data-field">
                  <div className="data-field-label">Coordinates</div>
                  <div className="data-field-value">
                    {selectedMarker.lat.toFixed(4)}°, {selectedMarker.lng.toFixed(4)}°
                  </div>
                </div>
              </div>
              
              {/* Credibility Score */}
              <div className="data-card">
                <div className="data-card-header" style={{ color: selectedMarker.color }}>Classification</div>
                <div className="data-field">
                  <div className="data-field-label">Category</div>
                  <div 
                    className="data-field-value"
                    style={{ 
                      color: selectedMarker.color,
                      fontWeight: 500
                    }}
                  >
                    {selectedMarker.category.charAt(0).toUpperCase() + selectedMarker.category.slice(1)}
                  </div>
                </div>
                {selectedMarker.credibility && (
                  <div className="data-field">
                    <div className="data-field-label">Credibility</div>
                    <div className="data-field-value">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{ 
                              width: `${(selectedMarker.credibility / 10) * 100}%`,
                              backgroundColor: selectedMarker.color,
                              boxShadow: `0 0 10px ${selectedMarker.color}80`
                            }}
                          ></div>
                        </div>
                        <span>{selectedMarker.credibility}/10</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="data-card">
                <div className="data-card-header" style={{ color: selectedMarker.color }}>Details</div>
                <div style={{ lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.9)' }}>
                  {selectedMarker.description}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-5">
                <button className="action-button" onClick={handleCloseModal}>
                  Close
                </button>
                <button 
                  className="action-button" 
                  style={{ 
                    backgroundColor: `${selectedMarker.color}30`,
                    borderColor: `${selectedMarker.color}80`
                  }}
                  onClick={() => {
                    handleCloseModal();
                    if (globeEl.current) {
                      globeEl.current.pointOfView({
                        lat: selectedMarker.lat,
                        lng: selectedMarker.lng,
                        altitude: 2.5
                      }, 1000);
                    }
                  }}
                >
                  Zoom to Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
