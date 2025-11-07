import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star, MapPin, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

interface GoogleBusinessSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  businessName: string;
  salonId: string;
  onImportSuccess: () => void;
}

export default function GoogleBusinessSearchDialog({
  open,
  onOpenChange,
  latitude,
  longitude,
  businessName,
  salonId,
  onImportSuccess,
}: GoogleBusinessSearchDialogProps) {
  const [searchState, setSearchState] = useState<'searching' | 'results' | 'confirming' | 'importing' | 'success' | 'error'>('searching');
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Format distance for display
  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    }
    return `${distanceKm.toFixed(1)}km away`;
  };

  // Search for businesses when dialog opens
  useEffect(() => {
    if (open && searchState === 'searching') {
      searchNearbyBusinesses();
    }
  }, [open]);

  const searchNearbyBusinesses = async () => {
    try {
      setSearchState('searching');
      setErrorMessage('');

      const response = await fetch('/api/google-places/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          businessName,
          radius: 50, // Search within 50 meters
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for businesses');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        setSearchState('results');
      } else {
        setErrorMessage('No matching businesses found nearby. Try adjusting your business name or location.');
        setSearchState('error');
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to search for businesses');
      setSearchState('error');
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : 'Failed to search for businesses',
        variant: "destructive",
      });
    }
  };

  const handleSelectBusiness = (place: GooglePlace) => {
    setSelectedPlace(place);
    setSearchState('confirming');
  };

  const handleConfirmImport = async () => {
    if (!selectedPlace) return;

    try {
      setSearchState('importing');

      const response = await fetch(`/api/salons/${salonId}/google-places/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: selectedPlace.place_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import reviews');
      }

      const data = await response.json();
      
      setSearchState('success');
      
      toast({
        title: "Success! 🎉",
        description: `Imported ${data.imported} reviews from Google. Your rating has been updated.`,
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onImportSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import reviews');
      setSearchState('error');
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Failed to import reviews',
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setSearchState('searching');
      setResults([]);
      setSelectedPlace(null);
      setErrorMessage('');
    }, 300);
  };

  const handleRetry = () => {
    setSearchState('searching');
    searchNearbyBusinesses();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {searchState === 'confirming' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchState('results')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {searchState === 'searching' && 'Searching Google Business...'}
            {searchState === 'results' && 'Select Your Business'}
            {searchState === 'confirming' && 'Confirm Import'}
            {searchState === 'importing' && 'Importing Reviews...'}
            {searchState === 'success' && 'Import Successful!'}
            {searchState === 'error' && 'Search Failed'}
          </DialogTitle>
          <DialogDescription>
            {searchState === 'searching' && `Looking for "${businessName}" near your location...`}
            {searchState === 'results' && 'Choose the business that matches your salon to import reviews and ratings.'}
            {searchState === 'confirming' && 'Review the details before importing reviews to your profile.'}
            {searchState === 'importing' && 'Please wait while we import your Google reviews...'}
            {searchState === 'success' && 'Your Google reviews and rating have been successfully imported.'}
            {searchState === 'error' && 'We encountered an issue while searching for your business.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Searching State */}
          {searchState === 'searching' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Searching nearby businesses...</p>
            </div>
          )}

          {/* Results State */}
          {searchState === 'results' && (
            <div className="space-y-3">
              {results.map((place) => {
                const distance = calculateDistance(
                  latitude,
                  longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng
                );

                return (
                  <div
                    key={place.place_id}
                    className="p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{place.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {place.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{place.rating.toFixed(1)}</span>
                                {place.user_ratings_total && (
                                  <span className="text-xs text-muted-foreground">
                                    ({place.user_ratings_total} reviews)
                                  </span>
                                )}
                              </div>
                            )}
                            {!place.rating && (
                              <span className="text-xs text-muted-foreground">No rating yet</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{place.formatted_address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-purple-600 font-medium">
                          {formatDistance(distance)}
                        </span>
                        <Button
                          onClick={() => handleSelectBusiness(place)}
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          Select This Business
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Confirmation State */}
          {searchState === 'confirming' && selectedPlace && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <h4 className="font-semibold text-lg mb-3">{selectedPlace.name}</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span>{selectedPlace.formatted_address}</span>
                  </div>
                  
                  {selectedPlace.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {selectedPlace.rating.toFixed(1)} rating
                        {selectedPlace.user_ratings_total && (
                          <span className="text-muted-foreground ml-1">
                            ({selectedPlace.user_ratings_total} reviews)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-sm mb-2 text-blue-900">What will be imported:</h5>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Google rating and review count</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Up to 5 most recent Google reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Overall rating will be recalculated</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> This will link your salon to this Google Business listing. 
                  Make sure this is the correct business before proceeding.
                </p>
              </div>
            </div>
          )}

          {/* Importing State */}
          {searchState === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Importing your Google reviews...</p>
              <p className="text-xs text-muted-foreground">This may take a moment</p>
            </div>
          )}

          {/* Success State */}
          {searchState === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2">Reviews Imported Successfully!</h4>
                <p className="text-sm text-muted-foreground">
                  Your Google rating and reviews are now visible on your profile
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {searchState === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2">Search Failed</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="mt-6">
          {searchState === 'results' && (
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="ghost" onClick={handleRetry}>
                Search Again
              </Button>
            </div>
          )}

          {searchState === 'confirming' && (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setSearchState('results')}>
                Back to Results
              </Button>
              <Button
                onClick={handleConfirmImport}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Confirm & Import
              </Button>
            </div>
          )}

          {searchState === 'error' && (
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={handleRetry}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Try Again
              </Button>
            </div>
          )}

          {(searchState === 'searching' || searchState === 'importing' || searchState === 'success') && (
            <Button variant="outline" onClick={handleClose} disabled={searchState !== 'success'}>
              {searchState === 'success' ? 'Close' : 'Cancel'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
