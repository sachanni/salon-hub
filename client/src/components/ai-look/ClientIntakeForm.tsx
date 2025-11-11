import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Upload, Sparkles, MapPin, Cloud } from 'lucide-react';
import WebcamCapture from './WebcamCapture';
import { useToast } from '@/hooks/use-toast';

interface ClientIntakeFormProps {
  onComplete: (data: any) => void;
}

export default function ClientIntakeForm({ onComplete }: ClientIntakeFormProps) {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not'>('prefer_not');
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [eventType, setEventType] = useState('');
  const [weather, setWeather] = useState('');
  const [location, setLocation] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [hairType, setHairType] = useState('');
  const [preferredBrands, setPreferredBrands] = useState<string[]>([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [isDetectingContext, setIsDetectingContext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const availableBrands = ['Lakme', 'L\'Oreal Paris', 'Maybelline', 'MAC', 'NYX', 'Sugar', 'Faces Canada'];

  useEffect(() => {
    detectUserContext();
  }, []);

  const detectUserContext = async () => {
    setIsDetectingContext(true);
    
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            setIsDetectingContext(false);
          },
          () => {
            toast({
              title: 'Location unavailable',
              description: 'Please enter location manually',
              variant: 'default',
            });
            setIsDetectingContext(false);
          }
        );
      } else {
        setIsDetectingContext(false);
      }
    } catch (error) {
      setIsDetectingContext(false);
    }
  };

  const compressImage = async (file: File, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxWidth) / height;
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    try {
      const compressedImage = await compressImage(file);
      setCustomerPhoto(compressedImage);
    } catch (error) {
      toast({
        title: 'Compression failed',
        description: 'Failed to process image. Please try another photo.',
        variant: 'destructive',
      });
    }
  };

  const handleWebcamCapture = async (photoDataUrl: string) => {
    const response = await fetch(photoDataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
    try {
      const compressedImage = await compressImage(file);
      setCustomerPhoto(compressedImage);
      setShowWebcam(false);
    } catch (error) {
      toast({
        title: 'Compression failed',
        description: 'Failed to process webcam photo.',
        variant: 'destructive',
      });
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  // Debounced submit handler to prevent rapid clicks / double submissions
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Prevent rapid clicks - throttle to max 1 request per 2 seconds
    if (isSubmitting) {
      toast({
        title: 'Analysis in progress',
        description: 'Please wait for the current analysis to complete',
        variant: 'default',
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: 'Customer name required',
        description: 'Please enter the customer\'s name',
        variant: 'destructive',
      });
      return;
    }

    if (!customerPhoto) {
      toast({
        title: 'Photo required',
        description: 'Please capture or upload a customer photo',
        variant: 'destructive',
      });
      return;
    }

    // Set submitting state immediately (leading execution)
    setIsSubmitting(true);

    // Execute analysis
    onComplete({
      customerName,
      gender,
      customerPhoto,
      eventType: eventType || 'casual',
      weather: weather || 'normal',
      location: location || 'indoor',
      skinTone: skinTone || 'auto-detect',
      hairType: hairType || 'auto-detect',
      preferredBrands: preferredBrands.length > 0 ? preferredBrands : undefined,
    });

    // Reset after 2 seconds to allow retries (but prevent rapid clicking)
    submitTimerRef.current = setTimeout(() => {
      setIsSubmitting(false);
    }, 2000);
  }, [customerName, customerPhoto, gender, eventType, weather, location, skinTone, hairType, preferredBrands, isSubmitting, onComplete, toast]);

  if (showWebcam) {
    return (
      <WebcamCapture
        onCapture={handleWebcamCapture}
        onCancel={() => setShowWebcam(false)}
      />
    );
  }

  return (
    <Card className="p-8 bg-white/80 backdrop-blur-sm border-purple-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            New Customer Session
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Let's create a personalized beauty look for your customer
          </p>
        </div>

        {/* Customer Name */}
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer's name"
            className="text-lg"
            required
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={(value: any) => setGender(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="prefer_not">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Photo Capture */}
        <div className="space-y-3">
          <Label>Customer Photo *</Label>
          
          {customerPhoto ? (
            <div className="relative">
              <img
                src={customerPhoto}
                alt="Customer"
                className="w-full max-h-80 object-contain rounded-lg border-2 border-purple-200 bg-gray-50"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setCustomerPhoto('')}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-32 flex-col gap-3 border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                onClick={() => setShowWebcam(true)}
              >
                <Camera className="h-8 w-8 text-purple-500" />
                <span>Use Camera</span>
              </Button>
              
              <label className="cursor-pointer">
                <div className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-md transition-colors">
                  <Upload className="h-8 w-8 text-purple-500" />
                  <span>Upload Photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Event Type */}
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue placeholder="Select event type (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual / Everyday</SelectItem>
              <SelectItem value="office">Office / Professional</SelectItem>
              <SelectItem value="party">Party / Night Out</SelectItem>
              <SelectItem value="wedding">Wedding / Bridal</SelectItem>
              <SelectItem value="date">Romantic Date</SelectItem>
              <SelectItem value="festival">Festival / Celebration</SelectItem>
              <SelectItem value="photoshoot">Photoshoot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Smart Context Detection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weather" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Weather
            </Label>
            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger>
                <SelectValue placeholder={isDetectingContext ? 'Detecting...' : 'Select weather'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunny">Sunny</SelectItem>
                <SelectItem value="cloudy">Cloudy</SelectItem>
                <SelectItem value="rainy">Rainy</SelectItem>
                <SelectItem value="humid">Humid</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={isDetectingContext ? 'Detecting...' : 'e.g., Indoor/Outdoor'}
            />
          </div>
        </div>

        {/* Optional Preferences */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="skinTone">Skin Tone (AI will detect)</Label>
            <Select value={skinTone} onValueChange={setSkinTone}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto-detect">Auto-detect</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="olive">Olive</SelectItem>
                <SelectItem value="tan">Tan</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hairType">Hair Type (AI will detect)</Label>
            <Select value={hairType} onValueChange={setHairType}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto-detect">Auto-detect</SelectItem>
                <SelectItem value="straight">Straight</SelectItem>
                <SelectItem value="wavy">Wavy</SelectItem>
                <SelectItem value="curly">Curly</SelectItem>
                <SelectItem value="coily">Coily</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Brand Preferences */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-base font-semibold">Preferred Brands (Optional)</Label>
          <p className="text-sm text-gray-600">Select brands to filter AI recommendations</p>
          <div className="grid grid-cols-2 gap-3">
            {availableBrands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={preferredBrands.includes(brand)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPreferredBrands([...preferredBrands, brand]);
                    } else {
                      setPreferredBrands(preferredBrands.filter(b => b !== brand));
                    }
                  }}
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
          {preferredBrands.length > 0 && (
            <p className="text-xs text-purple-600 font-medium">
              ✓ Selected: {preferredBrands.join(', ')}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
        >
          <Sparkles className="h-5 w-5" />
          Analyze with AI
        </Button>
      </form>
    </Card>
  );
}
