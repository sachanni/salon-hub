import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Home, 
  Building2, 
  Navigation, 
  Plus, 
  Search, 
  Clock,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: any) => void;
  currentLocation?: string;
  savedLocations?: any[];
  currentLocationCoords?: { lat: number; lng: number } | null;
  locationAccuracy?: number;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation = '',
  savedLocations = [],
  currentLocationCoords,
  locationAccuracy
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationType, setNewLocationType] = useState<'home' | 'work' | 'custom'>('custom');
  const [newLocationLabel, setNewLocationLabel] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const { toast } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(currentLocation);
      initializeSuggestions();
    }
  }, [isOpen, currentLocation, savedLocations, currentLocationCoords]);

  const initializeSuggestions = () => {
    const initialSuggestions = [];

    // Always add current location option (like Fresha.com)
    initialSuggestions.push({
      type: 'current',
      id: 'current-location',
      title: 'Use current location',
      subtitle: currentLocationCoords ? `Accuracy: ±${Math.round(locationAccuracy || 50)}m` : 'Find salons near you',
      coords: currentLocationCoords,
      icon: Navigation
    });

    // Add saved locations
    savedLocations.forEach(loc => {
      initialSuggestions.push({
        type: 'saved',
        id: loc.id,
        title: loc.label,
        subtitle: loc.address,
        coords: { lat: loc.lat, lng: loc.lng },
        icon: loc.type === 'home' ? Home : loc.type === 'work' ? Building2 : MapPin
      });
    });

    // Add quick action buttons
    initialSuggestions.push({
      type: 'action',
      id: 'add-home',
      title: 'Add home address',
      subtitle: 'Save your home location',
      icon: Home,
      action: 'add-home'
    });

    initialSuggestions.push({
      type: 'action',
      id: 'add-work',
      title: 'Add work address',
      subtitle: 'Save your work location',
      icon: Building2,
      action: 'add-work'
    });

    initialSuggestions.push({
      type: 'action',
      id: 'add-custom',
      title: 'Add custom address',
      subtitle: 'Save any location',
      icon: Plus,
      action: 'add-custom'
    });

    setSuggestions(initialSuggestions);
  };

  // Location search function
  const performLocationSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      initializeSuggestions();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const searchResults = (data.predictions || []).map((prediction: any) => ({
          type: 'search',
          id: prediction.place_id,
          title: prediction.structured_formatting?.main_text || prediction.description,
          subtitle: prediction.structured_formatting?.secondary_text || '',
          placeId: prediction.place_id,
          description: prediction.description,
          icon: MapPin
        }));

        // Combine search results with saved locations
        const combinedSuggestions = [
          ...searchResults,
          ...savedLocations.map(loc => ({
            type: 'saved',
            id: loc.id,
            title: loc.label,
            subtitle: loc.address,
            coords: { lat: loc.lat, lng: loc.lng },
            icon: loc.type === 'home' ? Home : loc.type === 'work' ? Building2 : MapPin
          }))
        ];

        setSuggestions(combinedSuggestions);
      }
    } catch (error) {
      console.error('Location search error:', error);
      toast({
        title: "Search error",
        description: "Unable to search locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [savedLocations, toast]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performLocationSearch(value);
    }, 300);
  };

  // Handle location selection
  const handleLocationSelect = async (suggestion: any) => {
    if (suggestion.type === 'action') {
      setNewLocationType(suggestion.action === 'add-home' ? 'home' : suggestion.action === 'add-work' ? 'work' : 'custom');
      setNewLocationLabel(suggestion.action === 'add-home' ? 'Home' : suggestion.action === 'add-work' ? 'Work' : '');
      setNewLocationAddress('');
      setShowAddLocation(true);
      return;
    }

    if (suggestion.type === 'current') {
      // Handle current location selection
      if (currentLocationCoords) {
        // Use existing coordinates
        onLocationSelect({
          address: 'Current Location',
          coords: currentLocationCoords,
          isCurrentLocation: true
        });
        onClose();
      } else {
        // Request location permission
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            });
          });

          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Reverse geocode to get address
          try {
            const response = await fetch(`/api/locations/geocode?lat=${coords.lat}&lng=${coords.lng}`);
            if (response.ok) {
              const data = await response.json();
              const address = data.results?.[0]?.formatted_address || 'Current Location';
              
              onLocationSelect({
                address,
                coords,
                isCurrentLocation: true
              });
              onClose();
            } else {
              // Use coordinates even if reverse geocoding fails
              onLocationSelect({
                address: 'Current Location',
                coords,
                isCurrentLocation: true
              });
              onClose();
            }
          } catch (error) {
            // Use coordinates even if reverse geocoding fails
            onLocationSelect({
              address: 'Current Location',
              coords,
              isCurrentLocation: true
            });
            onClose();
          }
        } catch (error) {
          toast({
            title: "Location access denied",
            description: "Please enable location access in your browser settings or enter an address manually.",
            variant: "destructive",
          });
        }
      }
      return;
    }

    if (suggestion.type === 'search') {
      // Get place details
      try {
        const response = await fetch(`/api/locations/details?place_id=${suggestion.placeId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const place = data.result;
          
          const locationData = {
            address: place.formatted_address,
            coords: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            placeId: suggestion.placeId
          };

          onLocationSelect(locationData);
          onClose();
        }
      } catch (error) {
        console.error('Error getting place details:', error);
        toast({
          title: "Error",
          description: "Unable to get location details. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Saved or current location
      onLocationSelect({
        address: suggestion.subtitle || suggestion.title,
        coords: suggestion.coords,
        isCurrentLocation: suggestion.type === 'current'
      });
      onClose();
    }
  };

  // Save new location
  const handleSaveLocation = async () => {
    if (!newLocationAddress.trim()) {
      toast({
        title: "Address required",
        description: "Please enter a valid address.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingLocation(true);
    try {
      // Get coordinates for the address
      const response = await fetch(`/api/locations/geocode?address=${encodeURIComponent(newLocationAddress)}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const coords = data.results?.[0]?.geometry?.location;

        if (coords) {
          const locationData = {
            type: newLocationType,
            label: newLocationLabel || (newLocationType === 'home' ? 'Home' : newLocationType === 'work' ? 'Work' : 'Custom'),
            address: newLocationAddress,
            lat: coords.lat,
            lng: coords.lng
          };

          // Save to backend
          const saveResponse = await fetch('/api/user/saved-locations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(locationData)
          });

          if (saveResponse.ok) {
            toast({
              title: "Location saved",
              description: `${locationData.label} address has been saved successfully.`,
            });

            // Select the newly saved location
            onLocationSelect({
              address: newLocationAddress,
              coords: { lat: coords.lat, lng: coords.lng }
            });
            onClose();
          } else {
            throw new Error('Failed to save location');
          }
        } else {
          throw new Error('Unable to find coordinates for this address');
        }
      } else {
        throw new Error('Unable to geocode address');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Save error",
        description: "Unable to save location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingLocation(false);
    }
  };

  const renderSuggestion = (suggestion: any, index: number) => {
    const IconComponent = suggestion.icon || MapPin;

    if (suggestion.type === 'action') {
      return (
        <div
          key={`${suggestion.type}-${suggestion.id}-${index}`}
          onClick={() => handleLocationSelect(suggestion)}
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 border-l-transparent hover:border-l-primary"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <IconComponent className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground">{suggestion.title}</div>
            <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div
        key={`${suggestion.type}-${suggestion.id}-${index}`}
        onClick={() => handleLocationSelect(suggestion)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 border-l-transparent hover:border-l-primary"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">{suggestion.title}</div>
          <div className="text-xs text-muted-foreground truncate">{suggestion.subtitle}</div>
        </div>
        {suggestion.type === 'saved' && (
          <Badge variant="secondary" className="text-xs">
            Saved
          </Badge>
        )}
        {suggestion.type === 'current' && (
          <Badge variant="default" className="text-xs">
            Current
          </Badge>
        )}
      </div>
    );
  };

  if (showAddLocation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add {newLocationType === 'home' ? 'Home' : newLocationType === 'work' ? 'Work' : 'Custom'} Address
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {newLocationType === 'custom' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Label</label>
                <Input
                  value={newLocationLabel}
                  onChange={(e) => setNewLocationLabel(e.target.value)}
                  placeholder="e.g., Gym, School, etc."
                  className="w-full"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Address</label>
              <Input
                value={newLocationAddress}
                onChange={(e) => setNewLocationAddress(e.target.value)}
                placeholder="Enter full address"
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddLocation(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveLocation}
                disabled={isSavingLocation || !newLocationAddress.trim()}
                className="flex-1"
              >
                {isSavingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Choose Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for an address or place..."
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Suggestions List */}
          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching locations...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No locations found</p>
                <p className="text-xs text-muted-foreground/70">Try searching for a different address</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerModal;
