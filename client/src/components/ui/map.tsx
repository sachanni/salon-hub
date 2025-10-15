import { useEffect, useRef, useState } from 'react';

interface MapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  markerTitle?: string;
}

export function Map({ 
  latitude, 
  longitude, 
  zoom = 15, 
  className = "w-full h-48 rounded-lg",
  markerTitle = "Location"
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setMapError("Google Maps API key not configured");
        return;
      }

      if (!mapRef.current) return;

      try {
        // Check if Google Maps is already loaded
        if (!(window as any).google) {
          // Load Google Maps script
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
          script.async = true;
          script.defer = true;
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
          });
        }

        // Initialize map
        const position = { lat: latitude, lng: longitude };
        
        if (!mapInstanceRef.current && mapRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: position,
            zoom: zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          });

          // Add marker
          markerRef.current = new google.maps.Marker({
            position: position,
            map: mapInstanceRef.current,
            title: markerTitle,
            animation: google.maps.Animation.DROP,
          });
        } else if (mapInstanceRef.current) {
          // Update existing map
          mapInstanceRef.current.setCenter(position);
          if (markerRef.current) {
            markerRef.current.setPosition(position);
          }
        }

        setMapError(null);
      } catch (error) {
        console.error('Map initialization error:', error);
        setMapError(error instanceof Error ? error.message : 'Failed to load map');
      }
    };

    initMap();
  }, [latitude, longitude, zoom, markerTitle]);

  if (mapError) {
    return (
      <div className={className}>
        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center rounded-lg">
          <div className="text-center text-purple-600 p-4">
            <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium">Map unavailable</p>
            <p className="text-xs text-purple-500 mt-1">{mapError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      data-testid="google-map"
    />
  );
}
