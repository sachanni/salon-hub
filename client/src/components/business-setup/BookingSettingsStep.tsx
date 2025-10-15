import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, Clock, DollarSign, Users, Calendar, Bell, 
  Sparkles, TrendingUp, Shield, Zap, Info, CheckCircle2,
  Timer, UserCheck, BanknoteIcon, Gift, AlertCircle
} from "lucide-react";

interface BookingSettingsStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

interface BookingFormData {
  advanceBookingDays: number;
  cancellationHours: number;
  requireDeposit: boolean;
  depositAmount: number;
  depositType: string;
  allowOnlineBooking: boolean;
  bookingBufferMinutes: number;
  maxConcurrentBookings: number;
  requireCustomerInfo: boolean;
  minimumLeadTimeHours: number;
  allowGroupBookings: boolean;
  maxGroupSize: number;
  sendAutomatedReminders: boolean;
  reminderHoursBefore: number;
}

// Service Category to Preset Mapping
const SERVICE_CATEGORY_TO_PRESET: { [key: string]: string } = {
  // Spa & Wellness categories
  'Massage': 'spa',
  'Facial': 'spa',
  'Body Treatment': 'spa',
  'Spa Package': 'spa',
  'Ayurvedic Treatment': 'spa',
  'Aromatherapy': 'spa',
  
  // Express/Quick categories
  'Threading': 'express',
  'Waxing': 'express',
  'Bleach': 'express',
  'Beard Grooming': 'express',
  'Makeup': 'express',
  
  // Premium/VIP categories
  'Bridal Services': 'premium',
  'Hair Extensions': 'premium',
  'Hair Treatment': 'premium',
  'Keratin Treatment': 'premium',
  
  // Hair Salon (default) categories
  'Haircut': 'salon',
  'Hair Color': 'salon',
  'Hair Styling': 'salon',
  'Nail Care': 'salon',
  'Pedicure & Manicure': 'salon',
  'Piercing': 'salon',
  'Tattoo': 'salon',
};

// Smart Presets for Different Business Types
const BOOKING_PRESETS = [
  {
    id: 'salon',
    name: 'Hair Salon',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    description: 'Optimized for hair salons with quick services',
    settings: {
      advanceBookingDays: 30,
      cancellationHours: 24,
      bookingBufferMinutes: 15,
      maxConcurrentBookings: 3,
      minimumLeadTimeHours: 2,
      allowGroupBookings: false,
      maxGroupSize: 1,
      sendAutomatedReminders: true,
      reminderHoursBefore: 24,
      requireDeposit: false,
      depositAmount: 20,
    }
  },
  {
    id: 'spa',
    name: 'Spa & Wellness',
    icon: Gift,
    color: 'from-pink-500 to-rose-500',
    description: 'Longer appointments with relaxation time',
    settings: {
      advanceBookingDays: 60,
      cancellationHours: 48,
      bookingBufferMinutes: 30,
      maxConcurrentBookings: 2,
      minimumLeadTimeHours: 12,
      allowGroupBookings: true,
      maxGroupSize: 4,
      sendAutomatedReminders: true,
      reminderHoursBefore: 48,
      requireDeposit: true,
      depositAmount: 25,
    }
  },
  {
    id: 'express',
    name: 'Express Services',
    icon: Zap,
    color: 'from-violet-500 to-purple-500',
    description: 'Quick services with high turnover',
    settings: {
      advanceBookingDays: 14,
      cancellationHours: 12,
      bookingBufferMinutes: 5,
      maxConcurrentBookings: 5,
      minimumLeadTimeHours: 1,
      allowGroupBookings: false,
      maxGroupSize: 1,
      sendAutomatedReminders: true,
      reminderHoursBefore: 12,
      requireDeposit: false,
      depositAmount: 0,
    }
  },
  {
    id: 'premium',
    name: 'Premium/VIP',
    icon: Shield,
    color: 'from-rose-500 to-pink-500',
    description: 'High-end services with strict policies',
    settings: {
      advanceBookingDays: 90,
      cancellationHours: 72,
      bookingBufferMinutes: 45,
      maxConcurrentBookings: 1,
      minimumLeadTimeHours: 24,
      allowGroupBookings: false,
      maxGroupSize: 1,
      sendAutomatedReminders: true,
      reminderHoursBefore: 72,
      requireDeposit: true,
      depositAmount: 50,
    }
  },
];

export default function BookingSettingsStep({ 
  salonId, 
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: BookingSettingsStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  
  const [formData, setFormData] = useState<BookingFormData>({
    advanceBookingDays: 30,
    cancellationHours: 24,
    requireDeposit: false,
    depositAmount: 0,
    depositType: "percentage",
    allowOnlineBooking: true,
    bookingBufferMinutes: 15,
    maxConcurrentBookings: 1,
    requireCustomerInfo: true,
    minimumLeadTimeHours: 2,
    allowGroupBookings: false,
    maxGroupSize: 1,
    sendAutomatedReminders: true,
    reminderHoursBefore: 24
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(true);
  const [suggestedPreset, setSuggestedPreset] = useState<{
    preset: typeof BOOKING_PRESETS[0];
    reason: string;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookingSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/salons', salonId, 'booking-settings'],
    enabled: !!salonId,
  });

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
  });

  const mapDatabaseToForm = (dbData: any): Partial<BookingFormData> => {
    if (!dbData) return {};
    
    // Determine if deposit is required and the amount
    const depositType = dbData.depositType ?? 'percentage';
    const requireDeposit = depositType === 'percentage' 
      ? (dbData.depositPercentage ?? 0) > 0 
      : (dbData.depositAmountFixed ?? 0) > 0;
    const depositAmount = depositType === 'percentage'
      ? dbData.depositPercentage ?? 0
      : dbData.depositAmountFixed ?? 0;
    
    return {
      advanceBookingDays: dbData.maxAdvanceBookingDays ?? 30,
      cancellationHours: dbData.cancelWindowMinutes ? Math.round(dbData.cancelWindowMinutes / 60) : 24,
      bookingBufferMinutes: dbData.bufferMinutes ?? 15,
      requireDeposit: requireDeposit,
      depositAmount: depositAmount,
      depositType: depositType,
      allowOnlineBooking: dbData.autoConfirm === 1,
      maxConcurrentBookings: dbData.maxConcurrentBookings ?? 1,
      requireCustomerInfo: true, // Not stored in DB, always true
      minimumLeadTimeHours: dbData.leadTimeMinutes ? Math.round(dbData.leadTimeMinutes / 60) : 2,
      allowGroupBookings: dbData.allowGroupBookings === 1,
      maxGroupSize: dbData.maxGroupSize ?? 1,
      sendAutomatedReminders: dbData.sendAutomatedReminders === 1,
      reminderHoursBefore: dbData.reminderHoursBefore ?? 24,
    };
  };

  const mapFormToDatabase = (formData: BookingFormData) => {
    return {
      maxAdvanceBookingDays: formData.advanceBookingDays,
      cancelWindowMinutes: formData.cancellationHours * 60,
      bufferMinutes: formData.bookingBufferMinutes,
      leadTimeMinutes: formData.minimumLeadTimeHours * 60,
      depositType: formData.depositType,
      depositPercentage: formData.depositType === 'percentage' && formData.requireDeposit 
        ? formData.depositAmount 
        : 0,
      depositAmountFixed: formData.depositType === 'fixed' && formData.requireDeposit 
        ? formData.depositAmount 
        : 0,
      autoConfirm: formData.allowOnlineBooking ? 1 : 0,
      allowCancellation: 1,
      allowRescheduling: 1,
      maxConcurrentBookings: formData.maxConcurrentBookings,
      allowGroupBookings: formData.allowGroupBookings ? 1 : 0,
      maxGroupSize: formData.maxGroupSize,
      sendAutomatedReminders: formData.sendAutomatedReminders ? 1 : 0,
      reminderHoursBefore: formData.reminderHoursBefore,
    };
  };

  useEffect(() => {
    if (bookingSettings) {
      const mappedData = mapDatabaseToForm(bookingSettings);
      setFormData((prev: BookingFormData) => ({
        ...prev,
        ...mappedData
      }));
      setShowPresets(false);
    }
  }, [bookingSettings]);

  // Auto-suggest preset based on services
  useEffect(() => {
    if (services && Array.isArray(services) && services.length > 0 && !bookingSettings && showPresets) {
      const suggestion = analyzeServicesAndSuggestPreset(services);
      if (suggestion) {
        setSuggestedPreset(suggestion);
        // Auto-apply the suggested preset
        setFormData((prev) => ({
          ...prev,
          ...suggestion.preset.settings
        }));
        setSelectedPreset(suggestion.preset.id);
      }
    }
  }, [services, bookingSettings, showPresets]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const dbFormatData = mapFormToDatabase(data);
      const response = await apiRequest('POST', `/api/salons/${salonId}/booking-settings`, dbFormatData);
      return response.json();
    },
    onSuccess: (savedData) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'booking-settings'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
      });
      const mappedSavedData = mapDatabaseToForm(savedData);
      setFormData((prev: BookingFormData) => ({ ...prev, ...mappedSavedData }));
      handleNext();
      toast({
        title: "Booking Settings Saved!",
        description: "Your intelligent booking policies are now active.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save booking settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await saveSettingsMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Failed to save booking settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: BookingFormData) => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset: typeof BOOKING_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.settings
    }));
    setSelectedPreset(preset.id);
    setShowPresets(false);
    toast({
      title: `${preset.name} Preset Applied!`,
      description: preset.description,
    });
  };

  // Analyze services and suggest the best preset
  const analyzeServicesAndSuggestPreset = (services: any[]) => {
    if (!services || services.length === 0) {
      return null;
    }

    // Count services by preset recommendation
    const presetCounts: { [key: string]: { count: number; categories: string[] } } = {
      spa: { count: 0, categories: [] },
      express: { count: 0, categories: [] },
      premium: { count: 0, categories: [] },
      salon: { count: 0, categories: [] },
    };

    services.forEach(service => {
      const category = service.category;
      const recommendedPreset = SERVICE_CATEGORY_TO_PRESET[category] || 'salon';
      presetCounts[recommendedPreset].count++;
      if (!presetCounts[recommendedPreset].categories.includes(category)) {
        presetCounts[recommendedPreset].categories.push(category);
      }
    });

    // Find the preset with the most services
    let maxCount = 0;
    let suggestedPresetId = 'salon'; // Default
    let suggestedCategories: string[] = [];

    Object.entries(presetCounts).forEach(([presetId, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        suggestedPresetId = presetId;
        suggestedCategories = data.categories;
      }
    });

    const preset = BOOKING_PRESETS.find(p => p.id === suggestedPresetId);
    if (!preset) return null;

    // Generate reasoning based on detected categories
    let reason = '';
    if (suggestedPresetId === 'spa') {
      reason = `Based on your ${suggestedCategories.slice(0, 2).join(' & ')} services, we recommend longer appointments with relaxation time`;
    } else if (suggestedPresetId === 'express') {
      reason = `Based on your ${suggestedCategories.slice(0, 2).join(' & ')} services, we recommend quick turnover settings`;
    } else if (suggestedPresetId === 'premium') {
      reason = `Based on your ${suggestedCategories.slice(0, 2).join(' & ')} services, we recommend strict policies for high-end services`;
    } else {
      reason = `Based on your ${suggestedCategories.slice(0, 2).join(' & ')} services, we recommend standard salon settings`;
    }

    return { preset, reason };
  };

  // Smart Recommendations
  const getSmartRecommendation = () => {
    if (formData.bookingBufferMinutes < 10) {
      return {
        icon: AlertCircle,
        color: 'text-amber-600',
        message: 'Consider adding 10-15 min buffer to prevent overbooking'
      };
    }
    if (formData.cancellationHours < 24) {
      return {
        icon: Info,
        color: 'text-blue-600',
        message: '24-hour cancellation policy reduces no-shows by 40%'
      };
    }
    if (!formData.sendAutomatedReminders) {
      return {
        icon: Bell,
        color: 'text-purple-600',
        message: 'Automated reminders reduce no-shows by up to 50%'
      };
    }
    return {
      icon: CheckCircle2,
      color: 'text-green-600',
      message: 'Your booking settings are optimized for best experience!'
    };
  };

  const recommendation = getSmartRecommendation();
  const RecommendationIcon = recommendation.icon;

  if (isLoadingSettings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Intelligent Booking Settings
            </h3>
            <p className="text-muted-foreground">Loading your current settings...</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-48 bg-muted/50 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
          <Settings className="h-6 w-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" />
        </div>
        <div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Intelligent Booking Settings
          </h3>
          <p className="text-muted-foreground">
            Smart policies optimized for your business success
          </p>
        </div>
      </div>

      {/* Smart Recommendation Banner */}
      <Card className="border-purple-200 bg-gradient-to-br from-violet-50/50 to-pink-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <RecommendationIcon className={`h-5 w-5 ${recommendation.color}`} />
            <p className={`text-sm font-medium ${recommendation.color}`}>
              {recommendation.message}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Smart Preset Suggestion Banner */}
      {suggestedPreset && showPresets && (
        <Card className="border-green-300 bg-gradient-to-br from-green-50/80 to-emerald-50/80">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  ✨ Smart Suggestion: {suggestedPreset.preset.name} Preset
                </p>
                <p className="text-sm text-green-700">
                  {suggestedPreset.reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Presets */}
      {showPresets && (
        <Card className="border-purple-300 bg-gradient-to-br from-violet-50/50 to-pink-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Quick Start Presets
            </CardTitle>
            <CardDescription>
              {suggestedPreset 
                ? `We've pre-selected ${suggestedPreset.preset.name} for you, or choose another`
                : 'Choose a preset optimized for your business type'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BOOKING_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPreset === preset.id
                        ? 'border-purple-400 bg-gradient-to-r ' + preset.color + ' text-white shadow-lg'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${selectedPreset === preset.id ? 'text-white' : 'text-purple-500'}`} />
                      <div className="flex-1">
                        <h4 className={`font-semibold ${selectedPreset === preset.id ? 'text-white' : 'text-gray-900'}`}>
                          {preset.name}
                        </h4>
                        <p className={`text-sm mt-1 ${selectedPreset === preset.id ? 'text-white/90' : 'text-muted-foreground'}`}>
                          {preset.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowPresets(false)}
              className="w-full mt-4"
            >
              Or Customize Manually
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Online Booking */}
        <Card className="border-purple-200 bg-gradient-to-br from-violet-50/30 to-pink-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Online Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium">
                    Allow Online Booking
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Let customers book appointments 24/7 through your platform
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.allowOnlineBooking}
                onCheckedChange={(checked) => handleInputChange('allowOnlineBooking', checked)}
                data-testid="switch-online-booking"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium">
                    Require Customer Information
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Collect contact details for better service
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.requireCustomerInfo}
                onCheckedChange={(checked) => handleInputChange('requireCustomerInfo', checked)}
                data-testid="switch-customer-info"
              />
            </div>
          </CardContent>
        </Card>

        {/* Time & Scheduling - Advanced */}
        <Card className="border-purple-200 bg-gradient-to-br from-violet-50/30 to-pink-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Smart Time & Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advance-booking" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Advance Booking (Days)
                </Label>
                <Input
                  id="advance-booking"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.advanceBookingDays}
                  onChange={(e) => handleInputChange('advanceBookingDays', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-advance-booking"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum {formData.advanceBookingDays} days in advance
                </p>
              </div>

              <div>
                <Label htmlFor="min-lead-time" className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-purple-500" />
                  Minimum Lead Time (Hours)
                </Label>
                <Input
                  id="min-lead-time"
                  type="number"
                  min="0"
                  max="168"
                  value={formData.minimumLeadTimeHours}
                  onChange={(e) => handleInputChange('minimumLeadTimeHours', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-min-lead-time"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  At least {formData.minimumLeadTimeHours}h notice required
                </p>
              </div>

              <div>
                <Label htmlFor="cancellation-hours" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Cancellation Notice (Hours)
                </Label>
                <Input
                  id="cancellation-hours"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.cancellationHours}
                  onChange={(e) => handleInputChange('cancellationHours', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-cancellation-hours"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.cancellationHours}h notice for free cancellation
                </p>
              </div>

              <div>
                <Label htmlFor="buffer-minutes" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Booking Buffer (Minutes)
                </Label>
                <Input
                  id="buffer-minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.bookingBufferMinutes}
                  onChange={(e) => handleInputChange('bookingBufferMinutes', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-buffer-minutes"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.bookingBufferMinutes} min prep between appointments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Group Bookings */}
        <Card className="border-purple-200 bg-gradient-to-br from-violet-50/30 to-pink-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Capacity & Group Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max-concurrent" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Max Concurrent Bookings
                </Label>
                <Input
                  id="max-concurrent"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxConcurrentBookings}
                  onChange={(e) => handleInputChange('maxConcurrentBookings', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-max-concurrent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Handle up to {formData.maxConcurrentBookings} appointments simultaneously
                </p>
              </div>

              <div>
                <Label htmlFor="max-group-size" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Max Group Size
                </Label>
                <Input
                  id="max-group-size"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxGroupSize}
                  onChange={(e) => handleInputChange('maxGroupSize', parseInt(e.target.value))}
                  className="mt-1"
                  disabled={!formData.allowGroupBookings}
                  data-testid="input-max-group-size"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.allowGroupBookings ? `Up to ${formData.maxGroupSize} people per booking` : 'Enable group bookings first'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium">
                    Allow Group Bookings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Perfect for spa packages, parties, and events
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.allowGroupBookings}
                onCheckedChange={(checked) => handleInputChange('allowGroupBookings', checked)}
                data-testid="switch-group-bookings"
              />
            </div>
          </CardContent>
        </Card>

        {/* Automated Reminders */}
        <Card className="border-purple-200 bg-gradient-to-br from-violet-50/30 to-pink-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              Automated Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium">
                    Send Automated Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce no-shows by up to 50% with smart reminders
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.sendAutomatedReminders}
                onCheckedChange={(checked) => handleInputChange('sendAutomatedReminders', checked)}
                data-testid="switch-reminders"
              />
            </div>

            {formData.sendAutomatedReminders && (
              <div className="pt-2 border-t">
                <Label htmlFor="reminder-hours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Send Reminder (Hours Before)
                </Label>
                <Select 
                  value={formData.reminderHoursBefore.toString()} 
                  onValueChange={(value) => handleInputChange('reminderHoursBefore', parseInt(value))}
                >
                  <SelectTrigger className="mt-1" data-testid="select-reminder-hours">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="4">4 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before (Recommended)</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                    <SelectItem value="72">72 hours before</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Smart timing increases attendance by 35%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit Settings */}
        <Card className="border-purple-200 bg-gradient-to-br from-violet-50/30 to-pink-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              Deposit & Payment Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <BanknoteIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium">
                    Require Deposit
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Protect against no-shows with upfront deposit
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.requireDeposit}
                onCheckedChange={(checked) => handleInputChange('requireDeposit', checked)}
                data-testid="switch-require-deposit"
              />
            </div>

            {formData.requireDeposit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="deposit-type" className="text-sm font-medium">
                    Deposit Type
                  </Label>
                  <Select 
                    value={formData.depositType} 
                    onValueChange={(value) => handleInputChange('depositType', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-deposit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      <SelectItem value="percentage">Percentage of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deposit-amount" className="text-sm font-medium">
                    {formData.depositType === 'fixed' ? 'Deposit Amount (₹)' : 'Deposit Percentage (%)'}
                  </Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    min="0"
                    max={formData.depositType === 'fixed' ? "10000" : "100"}
                    value={formData.depositAmount}
                    onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value))}
                    className="mt-1"
                    data-testid="input-deposit-amount"
                  />
                  <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {formData.depositType === 'percentage' ? `${formData.depositAmount}% of service price` : `₹${formData.depositAmount} per booking`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Impact Preview */}
        <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Booking Impact Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-white/50">
                <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{formData.advanceBookingDays}</p>
                <p className="text-xs text-muted-foreground">Days Advance</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <Timer className="h-5 w-5 text-pink-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-pink-600">{formData.minimumLeadTimeHours}h</p>
                <p className="text-xs text-muted-foreground">Min Lead Time</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <Clock className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{formData.bookingBufferMinutes}m</p>
                <p className="text-xs text-muted-foreground">Buffer Time</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <Users className="h-5 w-5 text-pink-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-pink-600">{formData.maxConcurrentBookings}</p>
                <p className="text-xs text-muted-foreground">Max Concurrent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {showPresets && (
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                Choose a preset to get started quickly
              </Badge>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || saveSettingsMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-save-booking-settings"
          >
            {isLoading || saveSettingsMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
