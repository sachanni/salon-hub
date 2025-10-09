import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Star, Clock, Phone, Navigation, Filter, List, Map, ArrowLeft, Calendar, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import ErrorBoundary from './ErrorBoundary';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    }

// Real Leaflet map component with proper error handling
const MapComponent: React.FC<{
  salons: Salon[];
  userLocation?: { lat: number; lng: number };
  searchLocation?: { lat: number; lng: number };
  onSalonClick: (salon: Salon) => void;
  selectedSalonId?: string;
  searchLocationName?: string;
}> = ({ salons, userLocation, searchLocation, onSalonClick, selectedSalonId, searchLocationName = "Nirala Estate, Greater Noida" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const salonMarkersRef = useRef<Record<string, L.Marker>>({});

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
      // Calculate center of all locations (corrected coordinates)
      let center: [number, number] = [28.5355, 77.3910]; // Default to Greater Noida (corrected)
      
      if (searchLocation) {
        // Use search location as primary center
        center = [searchLocation.lat, searchLocation.lng];
      } else if (salons.length > 0) {
        const avgLat = salons.reduce((sum, salon) => sum + parseFloat(salon.latitude), 0) / salons.length;
        const avgLng = salons.reduce((sum, salon) => sum + parseFloat(salon.longitude), 0) / salons.length;
        center = [avgLat, avgLng];
      } else if (userLocation) {
        center = [userLocation.lat, userLocation.lng];
      }

      const map = L.map(mapRef.current).setView(center, 13);

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

  // Add markers when map is ready
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers
    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

  // Add user location marker (search location)
  if (searchLocation && mapInstance) {
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
    if (mapInstance) {
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
        
        // Double-check mapInstance is still valid before adding marker
        if (mapInstance) {
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
        }
      });

      // Set up global handler for popup buttons
      (window as any).salonClickHandler = (salonId: string) => {
        const salon = salons.find(s => s.id === salonId);
        if (salon) onSalonClick(salon);
      };
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
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button size="sm" variant="outline" className="bg-white shadow-md">
          <Navigation className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" className="bg-white shadow-md">
          <Map className="w-4 h-4" />
        </Button>
      </div>

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
          <span className="font-medium text-gray-700">Salons ({salons.length})</span>
        </div>
      </div>

      {/* Map Title */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 text-sm font-medium z-10">
        Map View - {salons.length} salons found
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
  searchLocationName = "Nirala Estate, Greater Noida"
}) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [timeSlotsData, setTimeSlotsData] = useState<Record<string, TimeSlotsData>>({});
  const [loadingTimeSlots, setLoadingTimeSlots] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');

  // Fetch salons based on search parameters
  useEffect(() => {
    const fetchSalons = async () => {
      if (!searchParams.coordinates) {
        setError('No search location provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          lat: searchParams.coordinates.lat.toString(),
          lng: searchParams.coordinates.lng.toString(),
          radiusKm: (searchParams.radius || 10).toString(),
          sort: sortBy,
        });

        if (searchParams.service) {
          params.append('q', searchParams.service);
        }

        if (searchParams.category) {
          params.append('category', searchParams.category);
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
  }, [searchParams, sortBy]);

  // Fetch time slots for all salons when they are loaded
  useEffect(() => {
    if (salons.length > 0) {
      salons.forEach(salon => {
        fetchTimeSlots(salon.id);
      });
    }
  }, [salons]);

  const handleSalonClick = (salon: Salon) => {
    // Open salon profile in new tab
    const salonProfileUrl = `/salon-profile?id=${salon.id}`;
    window.open(salonProfileUrl, '_blank');
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
          <p className="text-gray-600">Finding salons near you...</p>
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
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Ultra-Compact Header - Minimal Height */}
      <div className="bg-white border-b border-gray-200 px-4 py-1 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToSearch}
              className="text-gray-600 hover:text-gray-900 p-0 h-5"
            >
              <ArrowLeft className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium text-gray-900">
              {salons.length} salons found
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-2 py-0.5 text-xs h-5"
            >
              <List className="w-3 h-3 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="px-2 py-0.5 text-xs h-5"
            >
              <Map className="w-3 h-3 mr-1" />
              Map
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Sidebar */}
        <div className="w-[420px] min-w-[380px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Enhanced Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {salons.length} salons found
                </h2>
                <p className="text-sm text-gray-600">
                  Near {searchLocationName || 'your location'}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="p-2">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Enhanced Filters */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="distance">Distance</option>
                  <option value="rating">Rating</option>
                  <option value="name">Name</option>
                </select>
              </div>
              
              {/* Quick Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-blue-50">
                  Hair Salons
                </Badge>
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-blue-50">
                  Nail Salons
                </Badge>
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-blue-50">
                  Spas
                </Badge>
              </div>
            </div>
          </div>

          {/* Salon List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4 pr-2">
              {sortedSalons.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No salons found in this area</p>
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
                sortedSalons.map((salon, index) => (
                  <Card
                    key={salon.id}
                    data-salon-id={salon.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] mx-1 ${
                      selectedSalonId === salon.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:border-blue-200'
                    }`}
                    onClick={() => handleSalonClick(salon)}
                  >
                    <CardContent className="p-0">
                      {/* Salon Image - Fresha Style */}
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        {salon.imageUrl ? (
                          <img
                            src={salon.imageUrl}
                            alt={salon.name}
                            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                          />
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
                        )}
                        
                        {/* Distance Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 text-gray-800 text-xs font-medium px-2 py-1">
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

                      {/* Salon Details */}
                      <div className="p-4">
                        {/* Salon Name & Rating */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 break-words mb-1">
                              {salon.name}
                            </h3>
                            
                            {/* Rating & Reviews */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium text-gray-900">
                                  {formatRating(salon.rating)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({salon.reviewCount} reviews)
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Salon Number */}
                          <Badge variant="outline" className="text-xs font-medium ml-2">
                            #{index + 1}
                          </Badge>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 leading-relaxed break-words">
                              {salon.address}, {salon.city}
                            </p>
                          </div>
                        </div>

                        {/* Category & Services Preview */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {salon.category.replace('_', ' ')}
                          </Badge>
                          {salon.description && (
                            <span className="text-xs text-gray-500 truncate">
                              {salon.description.length > 50 
                                ? `${salon.description.substring(0, 50)}...` 
                                : salon.description
                              }
                            </span>
                          )}
                        </div>

                        {/* Operating Hours & Status */}
                        {salon.openTime && salon.closeTime && (
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                Open {salon.openTime} - {salon.closeTime}
                              </span>
                            </div>
                            
                            {/* Salon Status Indicator */}
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600 font-medium">Open now</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add to favorites
                            }}
                            className="flex-1"
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Share salon
                            }}
                            className="px-3"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Available Time Slots */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-medium">Available times</span>
                            <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                              View all
                            </span>
                          </div>
                          
                          {/* Time Slots */}
                          <div className="space-y-2">
                            {(() => {
                              const salonTimeSlots = timeSlotsData[salon.id];
                              const isLoading = loadingTimeSlots[salon.id];
                              
                              if (isLoading) {
                                return (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-xs text-gray-500">Loading times...</span>
                                  </div>
                                );
                              }
                              
            if (!salonTimeSlots || salonTimeSlots.availableSlots.length === 0) {
              return (
                <div className="text-center py-4">
                  <span className="text-xs text-gray-500">No availability set</span>
                  <div className="text-xs text-gray-400 mt-1">Salon needs to set up hours</div>
                </div>
              );
            }
                              
                              // Show first 3 available time slots
                              const displaySlots = salonTimeSlots.availableSlots.slice(0, 3);
                              
                              return displaySlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSalonClick(salon);
                                  }}
                                  className="w-full flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-blue-900 group-hover:text-blue-800">
                                      {slot.time}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-blue-600 font-medium">Available</div>
                                    <div className="text-xs text-gray-500">{slot.duration} mins</div>
                                  </div>
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Map View */}
        <div className="flex-1 h-full relative min-w-0">
          {viewMode === 'map' ? (
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
              <MapComponent
                salons={salons}
                userLocation={searchParams.coordinates}
                searchLocation={searchParams.coordinates}
                onSalonClick={handleSalonClick}
                selectedSalonId={selectedSalonId || undefined}
                searchLocationName={searchLocationName}
              />
            </ErrorBoundary>
          ) : (
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">List view is the same as sidebar</p>
                <p className="text-sm text-gray-500 mt-1">
                  Switch to map view to see salon locations
                </p>
              </div>
            </div>
          )}
          
          {/* Floating Action Button for Quick Booking */}
          {viewMode === 'map' && salons.length > 0 && (
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
    </div>
  );
};

export default SalonMapView;
