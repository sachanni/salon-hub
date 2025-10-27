import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface LocationPermissionDialogProps {
  onPermissionGranted: (coords: { lat: number; lng: number }) => void;
  onPermissionDenied: () => void;
}

export function LocationPermissionDialog({
  onPermissionGranted,
  onPermissionDenied,
}: LocationPermissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    const locationPermission = localStorage.getItem('location-permission');
    
    if (!locationPermission) {
      // Show dialog if no decision was made yet
      setIsOpen(true);
    } else if (locationPermission === 'granted') {
      // Automatically request location if previously granted
      requestLocation();
    }
  }, []);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('📍 Location permission granted:', coords);
          onPermissionGranted(coords);
        },
        (error) => {
          console.warn('Location error:', error);
          onPermissionDenied();
        }
      );
    } else {
      console.warn('Geolocation not supported');
      onPermissionDenied();
    }
  };

  const handleAllow = () => {
    localStorage.setItem('location-permission', 'granted');
    setIsOpen(false);
    requestLocation();
  };

  const handleDeny = () => {
    localStorage.setItem('location-permission', 'denied');
    setIsOpen(false);
    onPermissionDenied();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-location-permission">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full">
            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-center text-xl" data-testid="text-dialog-title">
            Enable Location
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 dark:text-gray-400" data-testid="text-dialog-description">
            We use your location to show salons near you.
            <br />
            Your data is only stored on your device.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleDeny}
            className="flex-1"
            data-testid="button-deny-location"
          >
            Deny
          </Button>
          <Button
            onClick={handleAllow}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            data-testid="button-allow-location"
          >
            Allow
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
