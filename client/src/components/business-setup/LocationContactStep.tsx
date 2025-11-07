import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Clock, Navigation, Search } from "lucide-react";
import GoogleBusinessSearchDialog from "./GoogleBusinessSearchDialog";
// Google Maps is now loaded using functional API instead of Loader class
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Indian States and Union Territories
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Major cities by state
const CITIES_BY_STATE: Record<string, string[]> = {
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Pitampura', 'Connaught Place', 'Lajpat Nagar', 'Vasant Kunj'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Shimoga', 'Davangere'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Noida', 'Greater Noida'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Udaipur', 'Ajmer', 'Bhilwara'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  'Haryana': ['Gurugram', 'Faridabad', 'Ghaziabad', 'Panipat', 'Ambala', 'Karnal'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati'],
};

// Default business hours template
const DEFAULT_HOURS = {
  monday: { open: true, start: '09:00', end: '19:00' },
  tuesday: { open: true, start: '09:00', end: '19:00' },
  wednesday: { open: true, start: '09:00', end: '19:00' },
  thursday: { open: true, start: '09:00', end: '19:00' },
  friday: { open: true, start: '09:00', end: '19:00' },
  saturday: { open: true, start: '09:00', end: '17:00' },
  sunday: { open: false, start: '09:00', end: '17:00' },
};

interface LocationContactStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

export default function LocationContactStep({ 
  salonId, 
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: LocationContactStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  const [formData, setFormData] = useState({
    shopNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    businessHours: "",
    latitude: null as number | null,
    longitude: null as number | null
  });
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Parse initial business hours - handle both string and object
  const parseBusinessHours = (hours: any) => {
    if (!hours) return DEFAULT_HOURS;
    if (typeof hours === 'object') return { ...DEFAULT_HOURS, ...hours };
    try {
      return { ...DEFAULT_HOURS, ...JSON.parse(hours) };
    } catch {
      return DEFAULT_HOURS;
    }
  };
  
  const [businessHours, setBusinessHours] = useState(parseBusinessHours(null));
  
  // Detect if initial city is custom (not in predefined list)
  const isInitialCityCustom = false;
    
  const [showCustomCity, setShowCustomCity] = useState(isInitialCityCustom);
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing salon data
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  // Helper function to check if value is a placeholder
  const isPlaceholderValue = (value: string | null | undefined): boolean => {
    if (!value) return true;
    const placeholders = [
      'Please update your address',
      'Please update',
      'Please update your phone',
      '00000'
    ];
    return placeholders.includes(value.trim());
  };

  // Populate form with existing data
  useEffect(() => {
    if (salonData && !formData.address) {
      const data = salonData as any;
      
      // Filter out placeholder values - treat them as empty strings
      const cleanShopNumber = isPlaceholderValue(data.shopNumber) ? "" : data.shopNumber;
      const cleanAddress = isPlaceholderValue(data.address) ? "" : data.address;
      const cleanCity = isPlaceholderValue(data.city) ? "" : data.city;
      const cleanState = isPlaceholderValue(data.state) ? "" : data.state;
      const cleanZipCode = isPlaceholderValue(data.zipCode) ? "" : data.zipCode;
      const cleanPhone = isPlaceholderValue(data.phone) ? "" : data.phone;
      const cleanEmail = isPlaceholderValue(data.email) ? "" : data.email;
      
      setFormData({
        shopNumber: cleanShopNumber || "",
        address: cleanAddress || "",
        city: cleanCity || "",
        state: cleanState || "",
        zipCode: cleanZipCode || "",
        phone: cleanPhone || "",
        email: cleanEmail || "",
        businessHours: data.businessHours || "",
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      });
      
      // Parse and set business hours using same logic
      if (data.businessHours) {
        setBusinessHours(parseBusinessHours(data.businessHours));
      }
      
      // Check if loaded city is custom (not in predefined list) - only if not a placeholder
      if (cleanCity && cleanState) {
        const citiesForState = CITIES_BY_STATE[cleanState] || [];
        if (!citiesForState.includes(cleanCity)) {
          setShowCustomCity(true);
        }
      }
    }
  }, [salonData, formData.address]);

  // Update salon mutation
  const updateSalonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}`, data);
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate both salon data and completion status
      await queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
      });
      
      toast({
        title: "Location & Contact Saved",
        description: "Your location and contact details have been updated successfully.",
      });
      
      // Call handleNext after successful save
      handleNext();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save location and contact information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address.trim() || !formData.city.trim() || !formData.phone.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the address, city, and phone number.",
        variant: "destructive",
      });
      return;
    }

    // Convert business hours to string for storage
    const hoursString = JSON.stringify(businessHours);
    
    // Convert latitude/longitude to strings for API (API expects strings)
    const dataToSend = {
      ...formData,
      businessHours: hoursString,
      latitude: formData.latitude ? String(formData.latitude) : null,
      longitude: formData.longitude ? String(formData.longitude) : null,
    };
    
    setIsLoading(true);
    await updateSalonMutation.mutateAsync(dataToSend);
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => {
      const newData = { ...prev, [field]: value };
      
      // Clear coordinates when key address fields change so user can re-geocode
      if (['address', 'city', 'state', 'zipCode'].includes(field)) {
        return {
          ...newData,
          latitude: null,
          longitude: null
        };
      }
      
      return newData;
    });
  };

  // Geocode address using server-side API (industry standard - more reliable)
  const geocodeAddress = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast({
        title: "Missing Information",
        description: "Please fill in address, city, and state first.",
        variant: "destructive",
      });
      return;
    }

    // Build full address with ZIP code if available
    const addressParts = [
      formData.address,
      formData.city,
      formData.state
    ];
    
    if (formData.zipCode) {
      addressParts.push(formData.zipCode);
    }
    
    addressParts.push("India");
    
    const fullAddress = addressParts.join(", ");
    console.log("🔍 Geocoding address:", fullAddress);

    try {
      // Show loading state
      toast({
        title: "Finding Location...",
        description: "Searching for your address...",
      });

      // Use server-side geocoding API with timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `/api/places/geocode?address=${encodeURIComponent(fullAddress)}&countrycode=in`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.message || errorData.error || 'Geocoding failed');
      }

      const data = await response.json();
      console.log("✅ Geocoding success:", data);

      if (data.lat && data.lng) {
        setFormData((prev: typeof formData) => ({
          ...prev,
          latitude: data.lat,
          longitude: data.lng
        }));

        toast({
          title: "Location Found! 🗺️",
          description: `Coordinates: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}. You can drag the marker to adjust.`,
        });
      } else {
        throw new Error('No coordinates in response');
      }

    } catch (error) {
      console.error('❌ Geocoding error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The geocoding request took too long. Please try again or simplify your address.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Location Not Found",
          description: error instanceof Error ? error.message : "Could not find this address. Try simplifying it (e.g., just area and city).",
          variant: "destructive",
        });
      }
    }
  };

  const updateHours = (day: keyof typeof businessHours, field: string, value: any) => {
    setBusinessHours((prev: typeof businessHours) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const availableCities = formData.state ? (CITIES_BY_STATE[formData.state] || []) : [];

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    const initAutocomplete = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
      if (!apiKey || !addressInputRef.current) {
        console.error("Google Maps API key not found. Please check VITE_GOOGLE_MAPS_API_KEY in environment variables.");
        return;
      }

      try {
        // Load Google Maps using functional API
        // Check if already loaded
        if (!(window as any).google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
          script.async = true;
          script.defer = true;
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        setMapLoaded(true);

        // Access google from window after load
        const google = (window as any).google;
        
        // Initialize autocomplete with India bias
        const autocomplete = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            componentRestrictions: { country: "in" }, // Restrict to India
            fields: ["address_components", "geometry", "formatted_address", "name"],
            types: ["establishment", "geocode"]
          }
        );

        autocompleteRef.current = autocomplete;

        // CRITICAL: Ensure input stays editable after autocomplete initialization
        if (addressInputRef.current) {
          addressInputRef.current.removeAttribute('readonly');
          addressInputRef.current.removeAttribute('disabled');
          // Allow manual typing while keeping autocomplete suggestions
          addressInputRef.current.setAttribute('autocomplete', 'off');
        }

        // Listen for place selection
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            // User typed something but didn't select from dropdown - that's OK
            return;
          }

          // Extract address components (but NOT coordinates - let user click button for that)
          let address = place.formatted_address || "";
          let city = "";
          let state = "";
          let zipCode = "";

          place.address_components?.forEach((component: any) => {
            const types = component.types;
            
            if (types.includes("locality")) {
              city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state = component.long_name;
            } else if (types.includes("postal_code")) {
              zipCode = component.long_name;
            }
          });

          // Only update address details, NOT coordinates
          // User will click "Find Location on Map" to get coordinates
          setFormData((prev: typeof formData) => ({
            ...prev,
            address: address,
            city: city,
            state: state,
            zipCode: zipCode,
            // Clear old coordinates so user can re-geocode with new address
            latitude: null,
            longitude: null
          }));

          // Reset custom city toggle if state has predefined cities
          if (state && CITIES_BY_STATE[state] && !CITIES_BY_STATE[state].includes(city)) {
            setShowCustomCity(true);
          } else {
            setShowCustomCity(false);
          }

          toast({
            title: "Address Selected",
            description: "Click 'Find Location on Map' to pinpoint your exact location.",
          });
        });
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initAutocomplete();
  }, [toast]);

  // Note: Removed auto-geocode - user will manually click "Find Location on Map" button

  // Initialize and update map when coordinates change
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;
    
    const google = (window as any).google;
    if (!google || !google.maps) return;

    // Only show map if we have coordinates
    if (!formData.latitude || !formData.longitude) {
      return;
    }

    try {
      const position = {
        lat: formData.latitude,
        lng: formData.longitude
      };

      // Initialize map if not already created
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapContainerRef.current, {
          center: position,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Create draggable marker
        markerRef.current = new google.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
          title: formData.address || "Your Business Location",
          animation: google.maps.Animation.DROP,
          draggable: true, // Allow users to drag the marker
        });

        // Update coordinates when marker is dragged
        markerRef.current.addListener('dragend', () => {
          const newPosition = markerRef.current.getPosition();
          if (newPosition) {
            setFormData((prev: typeof formData) => ({
              ...prev,
              latitude: newPosition.lat(),
              longitude: newPosition.lng()
            }));
            toast({
              title: "Location Updated",
              description: `📍 New coordinates: ${newPosition.lat().toFixed(6)}, ${newPosition.lng().toFixed(6)}`,
            });
          }
        });
      } else {
        // Update existing map and marker
        mapInstanceRef.current.setCenter(position);
        if (markerRef.current) {
          markerRef.current.setPosition(position);
          markerRef.current.setTitle(formData.address || "Your Business Location");
        }
      }
    } catch (error) {
      console.error("Google Maps display error:", error);
      // Map visualization failed, but coordinates are still valid
      // User can continue without the visual map
    }
  }, [mapLoaded, formData.latitude, formData.longitude, formData.address]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-6 w-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-semibold">Where can customers find you?</h3>
          <p className="text-muted-foreground">
            Provide your business location and contact information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address Section */}
        <div className="space-y-4 p-4 bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-700">Business Address</h4>
          
          {/* Shop Number */}
          <div className="space-y-2">
            <Label htmlFor="shopNumber" className="text-sm font-medium text-gray-700">
              Shop Number <span className="text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="shopNumber"
              type="text"
              placeholder="e.g., Shop 12, Suite 3B, Unit 5"
              value={formData.shopNumber}
              onChange={(e) => setFormData({...formData, shopNumber: e.target.value})}
              className="h-11"
            />
            <p className="text-xs text-gray-500">
              Add your shop/unit number if you're in a mall or building complex
            </p>
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium flex items-center justify-between">
              <span>Street Address *</span>
              {mapLoaded && (
                <span className="text-xs text-purple-600 flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  Start typing for suggestions
                </span>
              )}
            </Label>
            <Input
              ref={addressInputRef}
              id="address"
              value={formData.address}
              onChange={(e) => {
                handleInputChange('address', e.target.value);
                // Ensure field stays editable on every change
                if (e.target) {
                  e.target.removeAttribute('readonly');
                  e.target.removeAttribute('disabled');
                }
              }}
              onFocus={(e) => {
                // Ensure field is editable when focused
                e.target.removeAttribute('readonly');
                e.target.removeAttribute('disabled');
              }}
              placeholder="Start typing your business address..."
              className="mt-1"
              required
              readOnly={false}
              disabled={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* State Dropdown */}
            <div>
              <Label htmlFor="state" className="text-sm font-medium">
                State/UT *
              </Label>
              <Select 
                value={formData.state || ''} 
                onValueChange={(value) => {
                  handleInputChange('state', value);
                  // Reset city and custom city toggle if state changes
                  if (formData.state !== value) {
                    handleInputChange('city', '');
                    setShowCustomCity(false);
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {INDIAN_STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Dropdown/Input */}
            <div>
              <Label htmlFor="city" className="text-sm font-medium">
                City *
              </Label>
              {availableCities.length > 0 && !showCustomCity ? (
                <Select 
                  value={formData.city && !showCustomCity ? formData.city : ''} 
                  onValueChange={(value) => {
                    if (value === 'other') {
                      setShowCustomCity(true);
                      handleInputChange('city', '');
                    } else {
                      handleInputChange('city', value);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                    <SelectItem value="other">Other (type manually)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative mt-1">
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder={formData.state ? "Enter city name" : "Select state first"}
                    disabled={!formData.state}
                    required
                  />
                  {showCustomCity && availableCities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCity(false);
                        handleInputChange('city', '');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-600 hover:text-purple-700"
                    >
                      Use dropdown
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ZIP Code */}
            <div>
              <Label htmlFor="zipCode" className="text-sm font-medium">
                PIN Code
              </Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="110001"
                maxLength={6}
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Business Phone *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Business Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@yourbusiness.com"
              className="mt-1"
            />
          </div>

          {/* Find Location Button - Placed after all address fields */}
          <div className="pt-2 border-t border-purple-200">
            {formData.latitude && formData.longitude ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Location Set Successfully</p>
                    <p className="text-xs text-green-600">
                      Coordinates: {typeof formData.latitude === 'number' ? formData.latitude.toFixed(6) : formData.latitude}, {typeof formData.longitude === 'number' ? formData.longitude.toFixed(6) : formData.longitude}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={geocodeAddress}
                  className="bg-white hover:bg-green-50"
                >
                  Update Location
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  📍 Complete all fields above, then find your exact location on the map
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={geocodeAddress}
                  disabled={!formData.address || !formData.city || !formData.state}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Find Location on Map
                </Button>
                {(!formData.address || !formData.city || !formData.state) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    ⚠️ Please fill in Street Address, State, and City first
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Import from Google Button */}
          {formData.latitude && formData.longitude && formData.address && (
            <div className="pt-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                onClick={() => setShowGoogleImport(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                Import from Google (5 Reviews + Rating)
              </Button>
            </div>
          )}
        </div>

        {/* Map Preview Section */}
        {formData.latitude && formData.longitude && (
          <div className="space-y-3 p-4 bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-sm text-gray-700">Location on Map</h4>
              </div>
              <span className="text-xs text-gray-500">
                📍 {typeof formData.latitude === 'number' ? formData.latitude.toFixed(6) : formData.latitude}, {typeof formData.longitude === 'number' ? formData.longitude.toFixed(6) : formData.longitude}
              </span>
            </div>
            <div 
              ref={mapContainerRef}
              className="w-full h-[300px] rounded-lg border-2 border-purple-200 overflow-hidden shadow-sm"
            />
            <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-100 p-2 rounded-md">
              <Navigation className="h-3 w-3" />
              <span className="font-medium">Tip: Drag the marker to adjust your exact location</span>
            </div>
            <p className="text-xs text-gray-500">
              This is where your business will appear on the map for customers
            </p>
          </div>
        )}

        {/* Business Hours Section */}
        <div className="space-y-4 p-4 bg-gradient-to-br from-violet-50 to-pink-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-sm text-gray-700">Business Hours</h4>
          </div>
          <p className="text-xs text-gray-500">Set your operating hours for each day</p>

          <div className="space-y-3">
            {Object.entries(businessHours).map(([day, hours]) => {
              const hoursData = hours as { open: boolean; start: string; end: string };
              return (
                <div key={day} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={hoursData.open}
                      onCheckedChange={(checked) => updateHours(day as keyof typeof businessHours, 'open', checked)}
                    />
                    <span className="w-24 text-sm font-medium capitalize">{day}</span>
                    
                    {hoursData.open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={hoursData.start}
                          onChange={(e) => updateHours(day as keyof typeof businessHours, 'start', e.target.value)}
                          className="w-32 text-sm"
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                          type="time"
                          value={hoursData.end}
                          onChange={(e) => updateHours(day as keyof typeof businessHours, 'end', e.target.value)}
                          className="w-32 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
          </div>

          <Button
            type="submit"
            disabled={isLoading || updateSalonMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading || updateSalonMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>

      {/* Google Business Import Dialog */}
      <GoogleBusinessSearchDialog
        open={showGoogleImport}
        onOpenChange={setShowGoogleImport}
        latitude={formData.latitude || 0}
        longitude={formData.longitude || 0}
        businessName={(salonData as any)?.name || ''}
        salonId={salonId}
        onImportSuccess={() => {
          toast({ title: "Success!", description: "Google reviews imported successfully" });
          setShowGoogleImport(false);
          // Invalidate queries to refresh salon data
          queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
        }}
      />
    </div>
  );
}
