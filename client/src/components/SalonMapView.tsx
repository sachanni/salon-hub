import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Star, Clock, Phone, Filter, ArrowLeft, Calendar, Heart, Share2, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import ErrorBoundary from './ErrorBoundary';
import FilterPanel, { FilterState } from './FilterPanel';
import MapboxSalonMap from './MapboxSalonMap';
import SearchResultsHeader from './SearchResultsHeader';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ServiceDetail {
  name: string;
  durationMinutes: number;
  price: number;
  currency?: string;
}

interface Salon {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude: string;
  longitude: string;
  phone?: string;
  email?: string;
  website?: string;
  category: string;
  priceRange?: string;
  rating: string;
  reviewCount: number;
  imageUrl?: string;
  imageUrls?: string[];
  services?: ServiceDetail[]; // Services with details (name, price, duration)
  openTime?: string;
  closeTime?: string;
  distance_km?: number;
  outside_radius?: boolean;
  createdAt: string;
}

interface TimeSlot {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  duration: number;
  staffId?: string;
  isAvailable: boolean;
}

interface TimeSlotsData {
  salonId: string;
  date: string;
  totalSlots: number;
  availableSlots: TimeSlot[];
  groupedSlots: {
    morning: TimeSlot[];
    afternoon: TimeSlot[];
    evening: TimeSlot[];
  };
  allSlots: TimeSlot[];
}

interface SearchParams {
  coordinates?: { lat: number; lng: number };
  radius?: number;
  service?: string;
  category?: string;
  sortBy?: string;
  time?: string;
  date?: string;
  filters?: {
    priceRange?: [number, number];
    minRating?: number;
    availableToday?: boolean;
    specificServices?: string[];
  };
}

interface SalonMapViewProps {
      searchParams: SearchParams;
      onBackToSearch: () => void;
      searchLocationName?: string;
      onToggleToGrid?: () => void;
      onSalonCountChange?: (count: number) => void;
    }

// Real Leaflet map component with proper error handling
const MapComponent: React.FC<{
  salons: Salon[];
  userLocation?: { lat: number; lng: number };
  searchLocation?: { lat: number; lng: number };
  onSalonClick: (salon: Salon) => void;
  selectedSalonId?: string;
  searchLocationName?: string;
  searchRadius?: number;
}> = ({ salons, userLocation, searchLocation, onSalonClick, selectedSalonId, searchLocationName = "Nirala Estate, Greater Noida", searchRadius = 1 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const salonMarkersRef = useRef<Record<string, L.Marker>>({});

  // Calculate appropriate zoom level based on search radius
  const getZoomLevelForRadius = (radiusKm: number): number => {
    // Map radius to zoom levels for optimal viewing
    if (radiusKm <= 0.3) return 16;      // 300m - very close zoom
    if (radiusKm <= 0.5) return 15;      // 500m - close zoom
    if (radiusKm <= 1) return 14;        // 1km - medium-close zoom
    if (radiusKm <= 2) return 13;        // 2km - medium zoom
    if (radiusKm <= 5) return 12;        // 5km - wider zoom
    return 11;                            // Default for larger areas
  };

  // Retry mechanism with exponential backoff (Urban Company style)
  const retryMapInitialization = useCallback(async () => {
    if (retryCount >= 3) {
      setMapError('Unable to load map after multiple attempts. Please refresh the page.');
      setIsRetrying(false);
      return;
    }

    setIsRetrying(true);
    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
    
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
      setMapError(null);
      setMapInstance(null); // Reset map instance to trigger re-initialization
      setIsRetrying(false);
    }, delay);
  }, [retryCount]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    setMapLoading(true);
    setMapError(null);

    try {
      // Calculate center dynamically based on available data
      let center: [number, number];
      
      if (searchLocation) {
        // Use search location as primary center
        center = [searchLocation.lat, searchLocation.lng];
      } else if (salons.length > 0) {
        const avgLat = salons.reduce((sum, salon) => sum + parseFloat(salon.latitude), 0) / salons.length;
        const avgLng = salons.reduce((sum, salon) => sum + parseFloat(salon.longitude), 0) / salons.length;
        center = [avgLat, avgLng];
      } else if (userLocation) {
        center = [userLocation.lat, userLocation.lng];
      } else {
        // Fallback: Delhi center (only if no location data available at all)
        center = [28.6139, 77.2090];
      }

      // Get appropriate zoom level based on search radius
      const zoomLevel = getZoomLevelForRadius(searchRadius);
      const map = L.map(mapRef.current).setView(center, zoomLevel);

      // Add tile layer with error handling (Fresha style)
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      });

      tileLayer.addTo(map);

      // Handle tile loading errors (non-critical)
      tileLayer.on('tileerror', (error) => {
        console.warn('Tile loading error (non-critical):', error);
      });

      // Wait for map to be ready with timeout (Uber style)
      const mapReadyPromise = new Promise<L.Map>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Map initialization timeout'));
        }, 10000); // 10 second timeout

        map.whenReady(() => {
          clearTimeout(timeout);
          resolve(map);
        });
      });

      mapReadyPromise.then((readyMap) => {
        setMapInstance(readyMap);
        setMapLoading(false);
        setRetryCount(0); // Reset retry count on success
        salonMarkersRef.current = {};
      }).catch((error) => {
        console.error('Map ready timeout:', error);
        setMapError('Map is taking too long to load. Retrying...');
        retryMapInitialization();
      });

      // Handle map errors
      map.on('error', (error) => {
        console.error('Map error:', error);
        setMapError('Failed to load map. Retrying...');
        retryMapInitialization();
      });

      return () => {
        if (map) {
          map.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
      setMapLoading(false);
    }
  }, [salons, userLocation, searchLocation]);

  // Update map zoom when radius changes
  useEffect(() => {
    if (!mapInstance || !searchRadius) return;
    
    try {
      // Check if map container is properly mounted
      const container = mapInstance.getContainer();
      if (!container || !container.parentElement) {
        console.warn('Map container not ready for zoom update');
        return;
      }

      const newZoomLevel = getZoomLevelForRadius(searchRadius);
      const currentZoom = mapInstance.getZoom();
      
      // Only update if zoom level actually changed
      if (currentZoom !== newZoomLevel) {
        // Disable animation to prevent race condition with marker updates
        mapInstance.setZoom(newZoomLevel, { animate: false });
      }
    } catch (error) {
      // Silently handle zoom update errors during hot reload
      console.debug('Zoom update skipped (map not ready):', error);
    }
  }, [mapInstance, searchRadius, getZoomLevelForRadius]);

  // Add markers when map is ready
  useEffect(() => {
    if (!mapInstance) return;

    // Ensure map container is mounted before adding markers
    try {
      const container = mapInstance.getContainer();
      if (!container || !container.parentElement) {
        console.warn('Map container not mounted yet, skipping marker addition');
        return;
      }

      // Clear existing markers safely
      const markersToRemove: L.Marker[] = [];
      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          markersToRemove.push(layer);
        }
      });
      
      // Remove markers in a separate loop to avoid iteration issues
      markersToRemove.forEach((marker) => {
        try {
          if (mapInstance.hasLayer(marker)) {
            mapInstance.removeLayer(marker);
          }
        } catch (e) {
          // Silently handle marker removal errors
          console.debug('Marker removal warning:', e);
        }
      });
      
      // Clear marker references
      salonMarkersRef.current = {};

      // Add user location marker (search location)
      if (searchLocation) {
        const userIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 32px; height: 32px;">
              <!-- Outer pulsing ring -->
              <div style="position: absolute; top: 0; left: 0; width: 32px; height: 32px; background-color: #60a5fa; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
              <!-- Inner pulsing ring -->
              <div style="position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; background-color: #3b82f6; border-radius: 50%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
              <!-- Center dot -->
              <div style="position: relative; width: 16px; height: 16px; background-color: white; border-radius: 50%; border: 2px solid #2563eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; margin: 8px auto;">
                <div style="width: 8px; height: 8px; background-color: #2563eb; border-radius: 50%;"></div>
              </div>
            </div>
          `,
          className: 'custom-user-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        
        const userMarker = L.marker([searchLocation.lat, searchLocation.lng], { icon: userIcon })
          .addTo(mapInstance);
        
        userMarker.bindPopup(`
          <div class="text-center min-w-[200px]">
            <div class="flex items-center justify-center mb-2">
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              <div class="font-semibold text-blue-600">Your Search Location</div>
            </div>
            <div class="text-sm text-gray-600 mb-2">You're searching from here</div>
            <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mb-1">
              <div class="font-medium">${searchLocationName}</div>
              <div class="text-gray-400">${searchLocation.lat.toFixed(4)}, ${searchLocation.lng.toFixed(4)}</div>
            </div>
          </div>
        `);
      }

      // Add salon markers
      salons.forEach((salon, index) => {
        const isSelected = selectedSalonId === salon.id;
        const salonIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 40px; height: 40px;">
              <!-- Shadow/glow effect -->
              <div style="position: absolute; top: 0; left: 0; width: 40px; height: 40px; background-color: #f87171; border-radius: 50%; opacity: 0.3; filter: blur(2px);"></div>
              <!-- Main marker -->
              <div style="position: relative; width: 32px; height: 32px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; border: 3px solid white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; margin: 4px auto; ${isSelected ? 'box-shadow: 0 0 0 4px rgba(252, 165, 165, 0.5);' : ''}">
                ${index + 1}
              </div>
              <!-- Small highlight -->
              <div style="position: absolute; top: 5px; left: 5px; width: 8px; height: 8px; background-color: white; border-radius: 50%; opacity: 0.6;"></div>
            </div>
          `,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const salonMarker = L.marker([parseFloat(salon.latitude), parseFloat(salon.longitude)], { icon: salonIcon });
        salonMarker.addTo(mapInstance);
        
        // Store marker reference for zoom functionality
        salonMarkersRef.current[salon.id] = salonMarker;
        
        const popupContent = `
          <div class="min-w-[200px]">
            <div class="font-semibold text-gray-900 mb-1">${salon.name}</div>
            <div class="text-sm text-gray-600 mb-2">${salon.address}</div>
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center gap-1">
                <span class="text-sm">${parseFloat(salon.rating).toFixed(1)} (${salon.reviewCount})</span>
              </div>
              <div class="text-sm text-gray-500">
                ${salon.distance_km ? (salon.distance_km < 1 ? (salon.distance_km * 1000).toFixed(0) + 'm away' : salon.distance_km.toFixed(1) + 'km away') : 'Distance unknown'}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">${salon.category.replace('_', ' ')}</span>
              <button onclick="window.salonClickHandler && window.salonClickHandler('${salon.id}')" class="text-xs bg-blue-500 text-white px-2 py-1 rounded">View Details</button>
            </div>
          </div>
        `;
        salonMarker.bindPopup(popupContent);
        salonMarker.on('click', () => onSalonClick(salon));
      });

      // Set up global handler for popup buttons
      (window as any).salonClickHandler = (salonId: string) => {
        const salon = salons.find(s => s.id === salonId);
        if (salon) onSalonClick(salon);
      };
    } catch (error) {
      console.error('Error adding markers to map:', error);
      return;
    }

  }, [mapInstance, salons, userLocation, searchLocation, selectedSalonId, onSalonClick]);

  // Listen for zoom to salon events
  useEffect(() => {
    const handleZoomToSalon = (event: CustomEvent) => {
      if (!mapInstance) return;
      
      const { lat, lng, salonId } = event.detail;
      
      // Zoom to the salon location
      mapInstance.setView([lat, lng], 16, {
        animate: true,
        duration: 1.0
      });
      
      // Highlight the salon marker by opening its popup
      setTimeout(() => {
        const salonMarker = salonMarkersRef.current[salonId];
        if (salonMarker) {
          salonMarker.openPopup();
        }
      }, 500);
    };

    window.addEventListener('zoomToSalon', handleZoomToSalon as EventListener);
    
    return () => {
      window.removeEventListener('zoomToSalon', handleZoomToSalon as EventListener);
    };
  }, [mapInstance, salons]);

    return (
      <div className="w-full h-full relative">
        {/* Skeleton Loading (Fresha Style) */}
        {mapLoading && !mapError && (
          <div className="absolute inset-0 bg-gray-100 z-10">
            <div className="animate-pulse">
              {/* Map skeleton */}
              <div className="h-full bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                {/* Grid pattern skeleton */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-8 gap-1 h-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="bg-gray-400 rounded-sm"></div>
                    ))}
                  </div>
                </div>
                
                {/* Loading indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading interactive map...</p>
                    <p className="text-gray-500 text-sm mt-1">This may take a few seconds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error State with Retry (Urban Company Style) */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-6 max-w-md">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Failed</h3>
              <p className="text-gray-600 mb-4">{mapError}</p>
              
              <div className="space-y-3">
                {isRetrying ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="text-sm text-gray-600">Retrying in {Math.pow(2, retryCount)} seconds...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={retryMapInitialization} 
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={retryCount >= 3}
                    >
                      {retryCount >= 3 ? 'Max Retries Reached' : `Retry (${3 - retryCount} attempts left)`}
                    </button>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Refresh Page
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Custom CSS for marker animations */}
        <style>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .5;
            }
          }
          @keyframes bounceIn {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 text-xs z-10 border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-1 w-2 h-2 bg-white rounded-full border border-blue-600"></div>
          </div>
          <span className="font-medium text-gray-700">Your search location</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-4 h-4 bg-red-400 rounded-full opacity-30 blur-sm"></div>
            <div className="absolute inset-0 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full border border-white shadow-sm"></div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-60"></div>
          </div>
          <span className="font-medium text-gray-700">Studios ({salons.length})</span>
        </div>
      </div>

      {/* Map Title */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 text-sm font-medium z-10">
        Map View - {salons.length} studios found
        {searchLocation && (
          <div className="text-xs text-gray-500 mt-1">
            <div className="font-medium text-gray-700">Searching from: {searchLocationName}</div>
            <div className="text-gray-400">{searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const SalonMapView: React.FC<SalonMapViewProps> = ({
  searchParams,
  onBackToSearch,
  searchLocationName,
  onToggleToGrid,
  onSalonCountChange
}) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [timeSlotsData, setTimeSlotsData] = useState<Record<string, TimeSlotsData>>({});
  const [loadingTimeSlots, setLoadingTimeSlots] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  // Original search coordinates - for directions origin (updates only on new search, not "Search This Area")
  const [originalSearchCoordinates, setOriginalSearchCoordinates] = useState<{lat: number; lng: number} | undefined>(searchParams.coordinates);
  
  // Current search coordinates - for fetching salons (can change when user clicks "Search This Area")
  const [currentSearchCoordinates, setCurrentSearchCoordinates] = useState<{lat: number; lng: number} | undefined>(searchParams.coordinates);
  
  // Update coordinates when searchParams.coordinates changes (new search from home page)
  useEffect(() => {
    console.log('🗺️ SalonMapView: searchParams.coordinates changed:', searchParams.coordinates);
    if (searchParams.coordinates) {
      console.log('🗺️ SalonMapView: Updating coordinates to:', searchParams.coordinates);
      console.log('🗺️ SalonMapView: EXACT Lat:', searchParams.coordinates.lat, 'Lng:', searchParams.coordinates.lng);
      setOriginalSearchCoordinates(searchParams.coordinates);
      setCurrentSearchCoordinates(searchParams.coordinates);
    }
  }, [searchParams.coordinates]);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'recommended',
    maxPrice: 10000,
    venueType: 'everyone',
    instantBooking: false,
    availableToday: false,
  });

  // Fetch salons based on search parameters
  useEffect(() => {
    const fetchSalons = async () => {
      if (!currentSearchCoordinates) {
        setError('No search location provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Map filter sortBy to API sort parameter
        const apiSortMap: { [key: string]: string } = {
          'recommended': 'recommended',
          'nearest': 'distance',
          'top-rated': 'top-rated',
          'distance': 'distance'
        };

        const params = new URLSearchParams({
          lat: currentSearchCoordinates.lat.toString(),
          lng: currentSearchCoordinates.lng.toString(),
          radiusKm: (searchParams.radius || 10).toString(),
          sort: apiSortMap[filters.sortBy] || 'distance',
        });

        if (searchParams.service) {
          params.append('q', searchParams.service);
        }

        // Apply category filter
        if (searchParams.category) {
          params.append('category', searchParams.category);
        }

        // Apply advanced filters
        if (filters.maxPrice && filters.maxPrice < 10000) {
          params.append('maxPrice', filters.maxPrice.toString());
        }

        if (filters.venueType && filters.venueType !== 'everyone') {
          params.append('venueType', filters.venueType);
        }

        if (filters.availableToday) {
          params.append('availableToday', 'true');
        }

        if (filters.instantBooking) {
          params.append('instantBooking', 'true');
        }

        if (filters.offerDeals) {
          params.append('offerDeals', 'true');
        }

        if (filters.acceptGroup) {
          params.append('acceptGroup', 'true');
        }

        // Add time and date parameters for availability filtering
        if (searchParams.time) {
          params.append('time', searchParams.time);
        }

        if (searchParams.date) {
          params.append('date', searchParams.date);
        }

        const response = await fetch(`/api/search/salons?${params}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setSalons(data.salons || []);
      } catch (err) {
        console.error('Error fetching salons:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch salons');
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, [currentSearchCoordinates, searchParams.radius, searchParams.service, searchParams.category, searchParams.time, searchParams.date, sortBy, filters]);

  // Fetch time slots for all salons when they are loaded
  useEffect(() => {
    if (salons.length > 0) {
      salons.forEach(salon => {
        fetchTimeSlots(salon.id);
      });
    }
  }, [salons]);

  // Notify parent of salon count changes
  useEffect(() => {
    if (onSalonCountChange && !loading) {
      onSalonCountChange(salons.length);
    }
  }, [salons.length, loading, onSalonCountChange]);

  const handleSalonClick = (salon: Salon) => {
    // Just set selected salon - popup will show inline (industry standard behavior)
    setSelectedSalonId(salon.id);
  };

  // Carousel navigation functions
  const handlePreviousImage = (salonId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => ({
      ...prev,
      [salonId]: ((prev[salonId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const handleNextImage = (salonId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => ({
      ...prev,
      [salonId]: ((prev[salonId] || 0) + 1) % totalImages
    }));
  };

  const handleDotClick = (salonId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => ({
      ...prev,
      [salonId]: index
    }));
  };


  const formatDistance = (distance?: number) => {
    if (!distance) return 'Distance unknown';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const formatRating = (rating: string) => {
    const numRating = parseFloat(rating);
    return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
  };

  const sortedSalons = [...salons].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.distance_km || 0) - (b.distance_km || 0);
      case 'rating':
        return parseFloat(b.rating) - parseFloat(a.rating);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Fetch time slots for a specific salon
  const fetchTimeSlots = async (salonId: string) => {
    if (timeSlotsData[salonId] || loadingTimeSlots[salonId]) return;
    
    setLoadingTimeSlots(prev => ({ ...prev, [salonId]: true }));
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/salons/${salonId}/available-slots?date=${today}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }
      
      const rawSlots = await response.json();
      
      let formattedSlots: TimeSlot[] = [];
      
      if (rawSlots.length === 0) {
        // No real time slots available - salon hasn't set up availability patterns
        console.log(`No time slots available for salon ${salonId} - salon needs to set up availability patterns`);
        formattedSlots = [];
      } else {
        // Format time slots from API
        formattedSlots = rawSlots.map((slot: any) => {
          const startTime = new Date(slot.startDateTime);
          const endTime = new Date(slot.endDateTime);
          
          return {
            id: slot.id,
            time: startTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
            staffId: slot.staffId,
            isAvailable: !slot.isBooked && !slot.isBlocked
          };
        });
      }
      
      // Filter time slots based on user's search time and current time
      const now = new Date();
      const currentHour = now.getHours();
      
      // Filter out past time slots and show only relevant ones
      formattedSlots = formattedSlots.filter(slot => {
        const slotHour = new Date(slot.startTime).getHours();
        const slotDate = new Date(slot.startTime);
        const today = new Date();
        
        // If slot is for today, only show future slots
        if (slotDate.toDateString() === today.toDateString()) {
          return slotHour > currentHour;
        }
        
        // If slot is for future days, show all slots
        return slotDate > today;
      });
      
      // If user has selected a specific time range, filter to show relevant slots
      if (searchParams.time) {
        // Parse the time range from search params (e.g., "8:10 PM - 9:56 PM")
        const timeRange = searchParams.time;
        if (timeRange.includes(' - ')) {
          const [startTimeStr, endTimeStr] = timeRange.split(' - ');
          
          // Convert time strings to hours for comparison
          const parseTime = (timeStr: string) => {
            const [time, period] = timeStr.trim().split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let hour24 = hours;
            if (period === 'PM' && hours !== 12) hour24 += 12;
            if (period === 'AM' && hours === 12) hour24 = 0;
            return hour24 + (minutes / 60);
          };
          
          const startHour = parseTime(startTimeStr);
          const endHour = parseTime(endTimeStr);
          
          // Filter slots to show those within or close to the selected time range
          formattedSlots = formattedSlots.filter(slot => {
            const slotHour = new Date(slot.startTime).getHours() + (new Date(slot.startTime).getMinutes() / 60);
            // Show slots within 30 minutes before and after the selected range
            return slotHour >= (startHour - 0.5) && slotHour <= (endHour + 0.5);
          });
        }
      }
      
      // Group slots by time periods (morning, afternoon, evening)
      const groupedSlots = {
        morning: formattedSlots.filter((slot: TimeSlot) => {
          const hour = new Date(slot.startTime).getHours();
          return hour >= 6 && hour < 12;
        }),
        afternoon: formattedSlots.filter((slot: TimeSlot) => {
          const hour = new Date(slot.startTime).getHours();
          return hour >= 12 && hour < 18;
        }),
        evening: formattedSlots.filter((slot: TimeSlot) => {
          const hour = new Date(slot.startTime).getHours();
          return hour >= 18 && hour < 23;
        })
      };
      
      const data: TimeSlotsData = {
        salonId,
        date: today,
        totalSlots: formattedSlots.length,
        availableSlots: formattedSlots.filter((slot: TimeSlot) => slot.isAvailable),
        groupedSlots,
        allSlots: formattedSlots
      };
      
      setTimeSlotsData(prev => ({ ...prev, [salonId]: data }));
    } catch (error) {
      console.error('Error fetching time slots:', error);
      // Don't show error to user, just log it
    } finally {
      setLoadingTimeSlots(prev => ({ ...prev, [salonId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding studios near you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBackToSearch} variant="outline">
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      {/* CSS Grid layout - fixed map + scrollable sidebar like fresha.com */}
      <div className="grid grid-cols-1 md:grid-cols-[60%_40%] h-full">
        {/* Sidebar - Scrollable salon cards list */}
        <div className="bg-white md:border-r border-gray-200 flex flex-col h-full overflow-hidden">
          {/* Shared Header Component */}
          <SearchResultsHeader
            salonCount={salons.length}
            locationName={searchLocationName || 'your location'}
            onOpenFilters={() => setIsFilterPanelOpen(true)}
            viewMode="map"
            onToggleView={(mode) => {
              if (mode === 'grid' && onToggleToGrid) {
                onToggleToGrid();
              }
            }}
          />

          {/* Salon List */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {sortedSalons.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No studios found in this area</p>
                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    Try expanding your search radius or changing your location
                  </p>
                  <Button 
                    onClick={onBackToSearch}
                    variant="outline" 
                    size="sm"
                  >
                    ← Back to Search
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {sortedSalons.map((salon, index) => (
                  <Card
                    key={salon.id}
                    data-salon-id={salon.id}
                    className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
                      selectedSalonId === salon.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:border-blue-200'
                    }`}
                    onClick={() => handleSalonClick(salon)}
                  >
                    <CardContent className="p-0">
                      {/* Salon Image - Wider aspect ratio for compact height */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg">
                        {(() => {
                          const images = salon.imageUrls && salon.imageUrls.length > 0 
                            ? salon.imageUrls 
                            : salon.imageUrl 
                              ? [salon.imageUrl] 
                              : [];
                          const currentIndex = currentImageIndex[salon.id] || 0;
                          const hasMultipleImages = images.length > 1;

                          return images.length > 0 ? (
                            <>
                              {/* Current Image */}
                              <img
                                src={images[currentIndex]}
                                alt={`${salon.name} - Image ${currentIndex + 1}`}
                                className="w-full h-full object-cover transition-all duration-300"
                              />
                              
                              {/* Navigation Arrows - Show on hover if multiple images */}
                              {hasMultipleImages && (
                                <>
                                  <button
                                    onClick={(e) => handlePreviousImage(salon.id, images.length, e)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    data-testid={`button-prev-image-${salon.id}`}
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={(e) => handleNextImage(salon.id, images.length, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    data-testid={`button-next-image-${salon.id}`}
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Dot Indicators */}
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, idx) => (
                                      <button
                                        key={idx}
                                        onClick={(e) => handleDotClick(salon.id, idx, e)}
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                                          idx === currentIndex 
                                            ? 'bg-white w-4' 
                                            : 'bg-white/60 hover:bg-white/80'
                                        }`}
                                        data-testid={`button-dot-${salon.id}-${idx}`}
                                      />
                                    ))}
                                  </div>

                                  {/* Image Counter Badge */}
                                  <div className="absolute top-2 left-2">
                                    <Badge className="bg-black/60 text-white text-xs px-2 py-0.5">
                                      {currentIndex + 1}/{images.length}
                                    </Badge>
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center relative overflow-hidden">
                              {/* Background Pattern */}
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                              </div>
                              
                              {/* Content */}
                              <div className="text-center text-white relative z-10">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto backdrop-blur-sm border border-white/30">
                                  <span className="text-3xl font-bold text-white">{salon.name.charAt(0)}</span>
                                </div>
                                <p className="text-sm font-semibold text-white/90 drop-shadow-lg">{salon.name}</p>
                                <p className="text-xs text-white/70 mt-1">{salon.category.replace('_', ' ')}</p>
                              </div>
                              
                              {/* Decorative Elements */}
                              <div className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full"></div>
                              <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/10 rounded-full"></div>
                              <div className="absolute top-1/2 left-4 w-4 h-4 bg-white/10 rounded-full"></div>
                            </div>
                          );
                        })()}
                        
                        {/* Distance Badge - Fresha Style */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 shadow-sm">
                            {formatDistance(salon.distance_km)}
                          </Badge>
                        </div>

                        {/* Price Range Badge */}
                        {salon.priceRange && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {salon.priceRange}
                            </Badge>
                          </div>
                        )}

                        {/* Outside Radius Warning */}
                        {salon.outside_radius && (
                          <div className="absolute bottom-3 left-3 right-3">
                            <Badge variant="destructive" className="text-xs w-full justify-center">
                              Outside search radius
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Studio Details */}
                      <div className="p-3">
                        {/* Header: Name + Rating */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
                            {salon.name}
                          </h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                            <span className="text-sm font-semibold text-gray-900">
                              {formatRating(salon.rating)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({salon.reviewCount})
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <p className="text-xs text-gray-500 mb-3">
                          {formatDistance(salon.distance_km)} • {salon.city}
                        </p>

                        {/* Services with Time Slots - Fresha.com Style */}
                        {salon.services && salon.services.length > 0 && (
                          <div className="space-y-0">
                            {salon.services.slice(0, 3).map((service, idx) => {
                              const salonTimeSlots = timeSlotsData[salon.id];
                              const displaySlots = salonTimeSlots?.availableSlots?.slice(0, 3) || [];
                              const hasMoreSlots = (salonTimeSlots?.availableSlots?.length || 0) > 3;
                              
                              return (
                                <div key={idx} className="border-t border-gray-100 py-3 first:border-t-0 first:pt-0">
                                  {/* Service Header Row */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{service.name}</p>
                                      <p className="text-xs text-gray-500">{service.durationMinutes} mins</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0 whitespace-nowrap">
                                      {service.price > 0 ? `from ₹${service.price.toLocaleString()}` : 'Price on request'}
                                    </p>
                                  </div>
                                  
                                  {/* Time Slots Row - Fresha Style */}
                                  {displaySlots.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                      {displaySlots.map((slot) => (
                                        <button
                                          key={slot.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Navigate to salon with pre-selected service and time
                                            window.location.href = `/salon/${salon.id}?service=${encodeURIComponent(service.name)}&time=${encodeURIComponent(slot.time)}`;
                                          }}
                                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 hover:border-gray-300 transition-all duration-150"
                                        >
                                          {slot.time}
                                        </button>
                                      ))}
                                      {/* More options menu */}
                                      {hasMoreSlots && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSalonClick(salon);
                                          }}
                                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                          title="More time slots"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {salon.services.length > 3 && (
                              <a 
                                href={`/salon/${salon.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline pt-2 border-t border-gray-100 w-full"
                              >
                                See all {salon.services.length} services
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Map View - Fixed in viewport, doesn't scroll (fresha.com style) */}
        <div className="hidden md:block h-full sticky top-0 overflow-hidden">
          <ErrorBoundary
            fallback={
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Error</h3>
                  <p className="text-gray-600 mb-4">Unable to load the map component</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            }
          >
            <MapboxSalonMap
              salons={salons}
              userLocation={undefined}
              searchLocation={currentSearchCoordinates}
              onSalonClick={handleSalonClick}
              selectedSalonId={selectedSalonId || undefined}
              searchLocationName={searchLocationName}
              searchRadius={searchParams.radius}
              onSearchThisArea={(newCenter) => {
                // Update search coordinates to trigger re-fetch
                setCurrentSearchCoordinates(newCenter);
              }}
            />
          </ErrorBoundary>
          
          {/* Floating Action Button for Quick Booking */}
          {salons.length > 0 && (
            <div className="absolute bottom-6 right-6 z-10">
              <Button
                size="lg"
                className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                onClick={() => {
                  // Scroll to first salon or show booking modal
                  const firstSalon = document.querySelector('[data-salon-id]');
                  if (firstSalon) {
                    firstSalon.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Now
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          // Apply filters to salon list
        }}
        currentFilters={filters}
      />
    </div>
  );
};

export default SalonMapView;
