import React, { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import { MapPin, Search, Navigation, X } from 'lucide-react';
import Supercluster from 'supercluster';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  services?: ServiceDetail[];
  openTime?: string;
  closeTime?: string;
  distance_km?: number;
  outside_radius?: boolean;
  createdAt: string;
}

interface MapboxSalonMapProps {
  salons: Salon[];
  userLocation?: { lat: number; lng: number };
  searchLocation?: { lat: number; lng: number };
  onSalonClick: (salon: Salon) => void;
  selectedSalonId?: string;
  searchLocationName?: string;
  searchRadius?: number;
  onSearchThisArea?: (center: { lat: number; lng: number }) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Helper to calculate distance between two points (Haversine formula)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Fresha-style minimalist map with intelligent features
const MapboxSalonMap: React.FC<MapboxSalonMapProps> = ({
  salons,
  userLocation,
  searchLocation,
  onSalonClick,
  selectedSalonId,
  searchLocationName = "Search Location",
  searchRadius = 1,
  onSearchThisArea
}) => {
  const [popupInfo, setPopupInfo] = useState<Salon | null>(null);
  
  // Calculate initial center dynamically from search location or salons
  const getInitialCenter = () => {
    if (searchLocation) {
      return { longitude: searchLocation.lng, latitude: searchLocation.lat, zoom: 14 };
    }
    if (salons.length > 0) {
      const avgLng = salons.reduce((sum, s) => sum + parseFloat(s.longitude), 0) / salons.length;
      const avgLat = salons.reduce((sum, s) => sum + parseFloat(s.latitude), 0) / salons.length;
      return { longitude: avgLng, latitude: avgLat, zoom: 14 };
    }
    if (userLocation) {
      return { longitude: userLocation.lng, latitude: userLocation.lat, zoom: 14 };
    }
    // Fallback: Delhi center (only if no data available)
    return { longitude: 77.2090, latitude: 28.6139, zoom: 11 };
  };
  
  const [viewState, setViewState] = useState(getInitialCenter());
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [liveUserLocation, setLiveUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Salon | null>(null);
  const [directionOriginType, setDirectionOriginType] = useState<'search' | 'gps' | 'default'>('default');
  const mapRef = useRef<any>(null);
  const initialCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Calculate appropriate zoom level based on search radius
  const getZoomLevelForRadius = (radiusKm: number): number => {
    if (radiusKm <= 0.3) return 16;
    if (radiusKm <= 0.5) return 15;
    if (radiusKm <= 1) return 14;
    if (radiusKm <= 2) return 13;
    if (radiusKm <= 5) return 12;
    return 11;
  };

  // Initialize supercluster for marker clustering
  const cluster = useMemo(() => {
    const supercluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minZoom: 0,
      minPoints: 2
    });

    const points = salons.map(salon => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        salonId: salon.id,
        salon: salon
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [parseFloat(salon.longitude), parseFloat(salon.latitude)]
      }
    }));

    supercluster.load(points);
    return supercluster;
  }, [salons]);

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    if (!mapRef.current) return [];
    
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    
    return cluster.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      Math.floor(viewState.zoom)
    );
  }, [cluster, viewState.zoom, viewState.longitude, viewState.latitude]);

  // Set initial view based on search location or salons
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // If we have salons, fit them all in view
    if (salons.length > 0) {
      const lngs = salons.map(s => parseFloat(s.longitude));
      const lats = salons.map(s => parseFloat(s.latitude));
      
      // Include search location in bounds if available
      if (searchLocation) {
        lngs.push(searchLocation.lng);
        lats.push(searchLocation.lat);
      }
      
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)], // Southwest
        [Math.max(...lngs), Math.max(...lats)]  // Northeast
      ];

      // Set initial center for "Search This Area" button
      const centerLat = (bounds[0][1] + bounds[1][1]) / 2;
      const centerLng = (bounds[0][0] + bounds[1][0]) / 2;
      initialCenterRef.current = { lat: centerLat, lng: centerLng };

      mapRef.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 1000,
        maxZoom: 15
      });
    } 
    // If only search location, center on it
    else if (searchLocation) {
      initialCenterRef.current = { lat: searchLocation.lat, lng: searchLocation.lng };
      mapRef.current.flyTo({
        center: [searchLocation.lng, searchLocation.lat],
        zoom: getZoomLevelForRadius(searchRadius),
        duration: 1000
      });
    }
    // Fallback to user location
    else if (userLocation) {
      initialCenterRef.current = { lat: userLocation.lat, lng: userLocation.lng };
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        duration: 1000
      });
    }
  }, [searchLocation, salons, userLocation, searchRadius, mapLoaded]);

  // Check if map has moved significantly to show "Search This Area" button
  useEffect(() => {
    if (!initialCenterRef.current || !onSearchThisArea) {
      setShowSearchButton(false);
      return;
    }

    const distance = getDistance(
      initialCenterRef.current.lat,
      initialCenterRef.current.lng,
      viewState.latitude,
      viewState.longitude
    );

    // Show button if moved more than 500m or 30% of search radius
    const threshold = Math.max(0.5, searchRadius * 0.3);
    setShowSearchButton(distance > threshold);
  }, [viewState.latitude, viewState.longitude, searchRadius, onSearchThisArea]);

  // Zoom to specific salon when selected
  useEffect(() => {
    if (selectedSalonId && mapRef.current) {
      const salon = salons.find(s => s.id === selectedSalonId);
      if (salon) {
        mapRef.current.flyTo({
          center: [parseFloat(salon.longitude), parseFloat(salon.latitude)],
          zoom: 15,
          duration: 1000
        });
        setPopupInfo(salon);
      }
    }
  }, [selectedSalonId, salons]);

  // Listen for custom event to zoom to salon
  useEffect(() => {
    const handleZoomToSalon = (event: CustomEvent) => {
      const salonId = event.detail.salonId;
      if (mapRef.current) {
        const salon = salons.find(s => s.id === salonId);
        if (salon) {
          mapRef.current.flyTo({
            center: [parseFloat(salon.longitude), parseFloat(salon.latitude)],
            zoom: 15,
            duration: 1000
          });
          setPopupInfo(salon);
        }
      }
    };

    window.addEventListener('zoomToSalon', handleZoomToSalon as EventListener);
    return () => {
      window.removeEventListener('zoomToSalon', handleZoomToSalon as EventListener);
    };
  }, [salons]);

  const handleSearchThisArea = () => {
    if (onSearchThisArea) {
      onSearchThisArea({ lat: viewState.latitude, lng: viewState.longitude });
      initialCenterRef.current = { lat: viewState.latitude, lng: viewState.longitude };
      setShowSearchButton(false);
    }
  };

  const handleClusterClick = (clusterId: number, longitude: number, latitude: number) => {
    const expansionZoom = cluster.getClusterExpansionZoom(clusterId);
    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom: expansionZoom,
      duration: 500
    });
  };

  // Live user location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      return;
    }

    // Start watching user location
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLiveUserLocation(newLocation);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    watchIdRef.current = watchId;

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch directions from Mapbox Directions API
  const fetchDirections = async (destination: Salon) => {
    // When user has searched for a location, use that as origin (not their GPS location)
    // This ensures directions match the search context
    let origin;
    let originType: 'search' | 'gps' | 'default' = 'default';
    
    if (searchLocation) {
      origin = searchLocation;
      originType = 'search';
    } else if (liveUserLocation) {
      origin = liveUserLocation;
      originType = 'gps';
    } else if (userLocation) {
      origin = userLocation;
      originType = 'default';
    }
    
    if (!origin) {
      console.error('No origin location available');
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.longitude},${destination.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch directions');
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        setRouteData(data.routes[0]);
        setSelectedDestination(destination);
        setShowDirections(true);
        setDirectionOriginType(originType);

        // Fit map to route bounds
        const coordinates = data.routes[0].geometry.coordinates;
        
        // Calculate bounds manually
        const lngs = coordinates.map((c: any) => c[0]);
        const lats = coordinates.map((c: any) => c[1]);
        const bounds: [[number, number], [number, number]] = [
          [Math.min(...lngs), Math.min(...lats)], // Southwest
          [Math.max(...lngs), Math.max(...lats)]  // Northeast
        ];

        mapRef.current?.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  const clearDirections = () => {
    setRouteData(null);
    setShowDirections(false);
    setSelectedDestination(null);
  };

  // Route GeoJSON for display
  const routeGeoJSON = useMemo(() => {
    if (!routeData) return null;

    return {
      type: 'Feature' as const,
      geometry: routeData.geometry,
      properties: {}
    };
  }, [routeData]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Configuration Required</h3>
          <p className="text-gray-600 text-sm">Please configure VITE_MAPBOX_TOKEN to enable maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" data-testid="mapbox-salon-map">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        interactiveLayerIds={[]}
      >
        {/* Navigation Controls - Fresha style minimal */}
        <NavigationControl position="top-right" showCompass={false} />

        {/* Route Layer - Display directions */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#6b21a8',
                'line-width': 5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Live User Location Marker - Enhanced Design */}
        {(liveUserLocation || searchLocation) && (
          <Marker
            longitude={(liveUserLocation || searchLocation)!.lng}
            latitude={(liveUserLocation || searchLocation)!.lat}
            anchor="center"
          >
            <div className="relative" data-testid="user-location-marker">
              {/* Larger pulsing outer ring */}
              <div className="absolute -inset-2 w-16 h-16 bg-blue-400 rounded-full animate-ping opacity-40" />
              {/* Inner pulsing ring */}
              <div className="absolute inset-0 w-12 h-12 bg-blue-500 rounded-full animate-pulse opacity-50" />
              {/* Center dot with shadow - Navigation icon for live tracking */}
              <div className="relative w-8 h-8 bg-white rounded-full border-3 border-blue-600 shadow-2xl flex items-center justify-center m-2">
                {liveUserLocation ? (
                  <Navigation className="w-4 h-4 text-blue-600" />
                ) : (
                  <div className="w-4 h-4 bg-blue-600 rounded-full" />
                )}
              </div>
            </div>
          </Marker>
        )}

        {/* Clustered Salon Markers */}
        {clusters.map((cluster: any) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount, salonId } = cluster.properties;

          if (isCluster) {
            // Render cluster marker
            const size = 40 + (pointCount / salons.length) * 40; // Dynamic size based on point count
            
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                longitude={longitude}
                latitude={latitude}
                anchor="center"
              >
                <div
                  className="cursor-pointer transition-all hover:scale-110"
                  onClick={() => handleClusterClick(cluster.id, longitude, latitude)}
                  data-testid={`cluster-marker-${cluster.id}`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Cluster background */}
                  <div
                    className="absolute inset-0 bg-purple-600 rounded-full opacity-20 animate-pulse"
                    style={{ width: `${size}px`, height: `${size}px` }}
                  />
                  {/* Cluster circle */}
                  <div
                    className="bg-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white"
                    style={{
                      width: `${size * 0.75}px`,
                      height: `${size * 0.75}px`,
                      fontSize: `${Math.min(16, size * 0.3)}px`
                    }}
                  >
                    {pointCount}
                  </div>
                </div>
              </Marker>
            );
          }

          // Render individual salon marker
          const salon = cluster.properties.salon;
          const salonIndex = salons.findIndex(s => s.id === salonId);
          const isSelected = selectedSalonId === salonId;
          const markerColor = isSelected ? '#7c3aed' : '#6b21a8';

          return (
            <Marker
              key={`salon-${salonId}`}
              longitude={longitude}
              latitude={latitude}
              anchor="bottom"
              onClick={(e: any) => {
                e.originalEvent.stopPropagation();
                setPopupInfo(salon);
                onSalonClick(salon);
              }}
            >
              <div 
                className="cursor-pointer transition-all hover:scale-110 drop-shadow-xl"
                data-testid={`salon-marker-${salonId}`}
              >
                <svg
                  width="48"
                  height="60"
                  viewBox="0 0 48 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={isSelected ? 'animate-bounce' : ''}
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                >
                  {/* Pin shadow */}
                  <ellipse cx="24" cy="56" rx="12" ry="3" fill="rgba(0,0,0,0.3)" />
                  {/* Pin body */}
                  <path
                    d="M24 0C14.06 0 6 8.06 6 18c0 13.5 18 36 18 36s18-22.5 18-36c0-9.94-8.06-18-18-18z"
                    fill={markerColor}
                    stroke="white"
                    strokeWidth="3"
                  />
                  {/* Number circle */}
                  <circle cx="24" cy="18" r="12" fill="white" />
                  {/* Number text */}
                  <text
                    x="24"
                    y="24"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="700"
                    fill={markerColor}
                  >
                    {salonIndex + 1}
                  </text>
                </svg>
              </div>
            </Marker>
          );
        })}

        {/* Popup - Fresha style clean design */}
        {popupInfo && (
          <Popup
            longitude={parseFloat(popupInfo.longitude)}
            latitude={parseFloat(popupInfo.latitude)}
            anchor="top"
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
          >
            <div className="p-3" data-testid={`salon-popup-${popupInfo.id}`}>
              <h3 className="font-semibold text-gray-900 mb-1">{popupInfo.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{popupInfo.address}</p>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="text-sm font-medium">{popupInfo.rating}</span>
                  <span className="text-sm text-gray-500 ml-1">({popupInfo.reviewCount})</span>
                </div>
                {popupInfo.distance_km !== undefined && (
                  <span className="text-sm text-gray-500">
                    {popupInfo.distance_km.toFixed(1)} km
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => fetchDirections(popupInfo)}
                  className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                  data-testid={`button-get-directions-${popupInfo.id}`}
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </button>
                <a
                  href={`/salon/${popupInfo.id}`}
                  className="flex-1 bg-purple-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-center"
                  data-testid={`button-view-details-${popupInfo.id}`}
                >
                  View Details
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Search This Area Button - Intelligent positioning */}
      {showSearchButton && onSearchThisArea && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={handleSearchThisArea}
            className="bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:shadow-xl font-medium border border-gray-200"
            data-testid="button-search-this-area"
          >
            <Search className="w-4 h-4" />
            <span>Search this area</span>
          </button>
        </div>
      )}

      {/* Directions Panel */}
      {showDirections && routeData && selectedDestination && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-xl p-4 z-20 max-w-sm" data-testid="directions-panel">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Directions</h3>
            </div>
            <button
              onClick={clearDirections}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-clear-directions"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 mt-1.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {directionOriginType === 'search' ? searchLocationName : 'Your Location'}
                </p>
                <p className="text-xs text-gray-500">
                  {directionOriginType === 'search' ? 'Searched address' : 'Current position'}
                </p>
              </div>
            </div>
            
            <div className="ml-1.5 h-8 w-0.5 bg-gray-300" />
            
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600 mt-1.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{selectedDestination.name}</p>
                <p className="text-xs text-gray-500">{selectedDestination.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Driving Distance</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(routeData.distance / 1000).toFixed(1)} km
                </p>
                <p className="text-xs text-gray-500 mt-0.5">via roads</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.ceil(routeData.duration / 60)} min
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attribution - minimal Fresha style */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        © Mapbox
      </div>

      <style>{`
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 4px 8px;
          color: #6b7280;
        }
        .mapboxgl-popup-close-button:hover {
          background-color: transparent;
          color: #111827;
        }
        .mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
          border-bottom-color: white;
        }
        .mapboxgl-ctrl-group {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .mapboxgl-ctrl-group button {
          width: 32px;
          height: 32px;
        }
      `}</style>
    </div>
  );
};

export default MapboxSalonMap;
