import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertCircle } from 'lucide-react';
import { eventBasicInfoSchema, eventVenueSchemaBase, eventSettingsSchemaBase } from '@/lib/validations/eventSchemas';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

interface EventFormData {
  salonId: string;
  title: string;
  description: string;
  shortDescription: string;
  eventTypeId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venueType: 'salon' | 'external' | 'online';
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  venuePincode: string;
  venueLatitude: number | null;
  venueLongitude: number | null;
  maxCapacity: number;
  minCapacity: number;
  visibility: 'public' | 'private' | 'unlisted';
  coverImageUrl: string;
  cancellationPolicy: any;
}

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { toast} = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  
  // Get salonId from localStorage (set by BusinessDashboard)
  const salonId = typeof window !== 'undefined' ? localStorage.getItem('selectedSalonId') : null;
  
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    salonId: salonId || undefined,
    title: '',
    description: '',
    shortDescription: '',
    eventTypeId: undefined, // Optional field - don't send empty string
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venueType: 'salon',
    venueName: '',
    venueAddress: '',
    venueCity: '',
    venueState: '',
    venuePincode: '',
    maxCapacity: 50,
    minCapacity: 1,
    visibility: 'public',
    coverImageUrl: undefined, // Optional field - don't send empty string
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load draft event data if editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftParam = urlParams.get('draft');
    
    if (draftParam) {
      setDraftId(draftParam);
      setLoadingDraft(true);
      
      fetch(`/api/events/business/${draftParam}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load draft');
          return res.json();
        })
        .then(data => {
          console.log('📝 Draft data received:', data);
          const event = data.event; // Extract event from response
          
          // Populate form with draft data
          setFormData({
            salonId: event.salonId || salonId || undefined,
            title: event.title || '',
            description: event.description || '',
            shortDescription: event.shortDescription || '',
            eventTypeId: event.eventTypeId || undefined,
            startDate: event.startDate ? event.startDate.split('T')[0] : '',
            endDate: event.endDate ? event.endDate.split('T')[0] : '',
            startTime: event.startTime || '',
            endTime: event.endTime || '',
            venueType: event.venueType || 'salon',
            venueName: event.venueName || '',
            venueAddress: event.venueAddress || '',
            venueCity: event.venueCity || '',
            venueState: event.venueState || '',
            venuePincode: event.venuePincode || '',
            maxCapacity: event.maxCapacity || 50,
            minCapacity: event.minCapacity || 1,
            visibility: event.visibility || 'public',
            coverImageUrl: event.coverImageUrl || undefined,
          });
          
          setLoadingDraft(false);
          
          toast({
            title: "Draft Loaded",
            description: "Continue editing your draft event.",
          });
        })
        .catch(error => {
          console.error('Error loading draft:', error);
          setLoadingDraft(false);
          toast({
            title: "Error",
            description: "Failed to load draft. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [salonId, toast]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user updates it
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    try {
      setErrors({});
      
      if (step === 1) {
        // Validate basic info - don't send empty strings for optional fields
        const basicInfo = {
          title: formData.title || '',
          description: formData.description || '',
          shortDescription: formData.shortDescription || '',
          eventTypeId: formData.eventTypeId || undefined, // Optional - use undefined instead of empty string
          startDate: formData.startDate || '',
          endDate: formData.endDate || undefined,
          startTime: formData.startTime || '',
          endTime: formData.endTime || '',
          coverImageUrl: formData.coverImageUrl || undefined, // Optional - use undefined instead of empty string
        };
        eventBasicInfoSchema.parse(basicInfo);
      } else if (step === 2) {
        // Validate venue info
        const venueInfo = {
          venueType: formData.venueType || 'salon',
          venueName: formData.venueName || '',
          venueAddress: formData.venueAddress || '',
          venueCity: formData.venueCity || '',
          venueState: formData.venueState || '',
          venuePincode: formData.venuePincode || '',
        };
        eventVenueSchemaBase.parse(venueInfo);
        
        // Additional venue-specific validation
        if (formData.venueType !== 'online') {
          if (!formData.venueName?.trim()) {
            throw new z.ZodError([
              { code: 'custom', message: 'Venue name is required for physical events', path: ['venueName'] }
            ]);
          }
          if (!formData.venueAddress?.trim()) {
            throw new z.ZodError([
              { code: 'custom', message: 'Venue address is required for physical events', path: ['venueAddress'] }
            ]);
          }
        }
      } else if (step === 3) {
        // Validate settings with proper number coercion
        const maxCap = typeof formData.maxCapacity === 'number' ? formData.maxCapacity : parseInt(String(formData.maxCapacity || '0'));
        const minCap = typeof formData.minCapacity === 'number' ? formData.minCapacity : parseInt(String(formData.minCapacity || '0'));
        
        const settings = {
          maxCapacity: maxCap,
          minCapacity: minCap,
          visibility: formData.visibility || 'public',
        };
        eventSettingsSchemaBase.parse(settings);
        
        if (maxCap < minCap) {
          throw new z.ZodError([
            { code: 'custom', message: 'Maximum capacity must be greater than or equal to minimum capacity', path: ['maxCapacity'] }
          ]);
        }
      }
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        const errorMessages: string[] = [];
        
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
          errorMessages.push(err.message);
        });
        
        setErrors(newErrors);
        
        // Show toast notification with specific validation errors
        toast({
          title: "Validation Error",
          description: errorMessages.length > 1 
            ? `Please fix ${errorMessages.length} errors before continuing`
            : errorMessages[0],
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validate salonId exists
    if (!salonId) {
      toast({
        title: "Missing Salon",
        description: "Please select a salon from the business dashboard before creating an event.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Clean up the form data - remove empty strings for optional fields
      const cleanedData = {
        ...formData,
        salonId, // Ensure salonId is included
        eventTypeId: formData.eventTypeId || undefined,
        coverImageUrl: formData.coverImageUrl || undefined,
        endDate: formData.endDate || undefined,
      };
      
      // If editing draft, use PUT; otherwise POST
      const url = draftId ? `/api/events/business/${draftId}` : '/api/events';
      const method = draftId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: draftId ? "Draft Updated!" : "Event Created!",
          description: draftId 
            ? "Your draft has been updated successfully." 
            : "Your event has been created successfully as a draft.",
        });
        setLocation('/business/events/drafts');
      } else {
        const error = await response.json();
        
        // Show specific validation errors if available
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((err: any) => 
            `${err.path?.join('.') || 'Field'}: ${err.message}`
          ).join('\n');
          
          toast({
            title: "Validation Errors",
            description: errorMessages,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to Create Event",
            description: error.message || 'An error occurred while creating the event. Please try again.',
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Network Error",
        description: 'Failed to connect to the server. Please check your connection and try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Event details and schedule' },
    { number: 2, title: 'Venue', description: 'Location information' },
    { number: 3, title: 'Settings', description: 'Capacity and visibility' },
    { number: 4, title: 'Review', description: 'Review and create' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600">Fill in the details to create your event</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step.number
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 hidden md:block">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step.number ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Hair Styling Workshop"
                    value={formData.title || ''}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description *</Label>
                  <Input
                    id="shortDescription"
                    placeholder="Brief one-liner about the event"
                    value={formData.shortDescription || ''}
                    onChange={(e) => updateFormData('shortDescription', e.target.value)}
                    className={errors.shortDescription ? 'border-red-500' : ''}
                  />
                  {errors.shortDescription && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.shortDescription}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed event description..."
                    rows={6}
                    value={formData.description || ''}
                    onChange={(e) => updateFormData('description', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => updateFormData('startDate', e.target.value)}
                      className={errors.startDate ? 'border-red-500' : ''}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime || ''}
                      onChange={(e) => updateFormData('startTime', e.target.value)}
                      className={errors.startTime ? 'border-red-500' : ''}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => updateFormData('endDate', e.target.value)}
                      className={errors.endDate ? 'border-red-500' : ''}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.endDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime || ''}
                      onChange={(e) => updateFormData('endTime', e.target.value)}
                      className={errors.endTime ? 'border-red-500' : ''}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                  <Input
                    id="coverImageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.coverImageUrl || ''}
                    onChange={(e) => updateFormData('coverImageUrl', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 2: Venue */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="venueType">Venue Type *</Label>
                  <Select
                    value={formData.venueType || 'salon'}
                    onValueChange={(value) => updateFormData('venueType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salon">At Salon</SelectItem>
                      <SelectItem value="external">External Venue</SelectItem>
                      <SelectItem value="online">Online Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.venueType !== 'online' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="venueName">Venue Name</Label>
                      <Input
                        id="venueName"
                        placeholder="Venue name"
                        value={formData.venueName || ''}
                        onChange={(e) => updateFormData('venueName', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="venueAddress">Venue Address</Label>
                      <Textarea
                        id="venueAddress"
                        placeholder="Full address"
                        rows={3}
                        value={formData.venueAddress || ''}
                        onChange={(e) => updateFormData('venueAddress', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="venueCity">City</Label>
                        <Input
                          id="venueCity"
                          placeholder="City"
                          value={formData.venueCity || ''}
                          onChange={(e) => updateFormData('venueCity', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venueState">State</Label>
                        <Input
                          id="venueState"
                          placeholder="State"
                          value={formData.venueState || ''}
                          onChange={(e) => updateFormData('venueState', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venuePincode">Pincode</Label>
                        <Input
                          id="venuePincode"
                          placeholder="Pincode"
                          value={formData.venuePincode || ''}
                          onChange={(e) => updateFormData('venuePincode', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 3: Settings */}
            {currentStep === 3 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Max Capacity *</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      min="1"
                      value={formData.maxCapacity || 50}
                      onChange={(e) => updateFormData('maxCapacity', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minCapacity">Min Capacity</Label>
                    <Input
                      id="minCapacity"
                      type="number"
                      min="1"
                      value={formData.minCapacity || 1}
                      onChange={(e) => updateFormData('minCapacity', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility *</Label>
                  <Select
                    value={formData.visibility || 'public'}
                    onValueChange={(value) => updateFormData('visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (Visible to everyone)</SelectItem>
                      <SelectItem value="private">Private (Invite only)</SelectItem>
                      <SelectItem value="unlisted">Unlisted (Link only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-purple-50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg">Event Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Title:</p>
                      <p className="font-medium">{formData.title || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date:</p>
                      <p className="font-medium">{formData.startDate || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time:</p>
                      <p className="font-medium">{formData.startTime || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Capacity:</p>
                      <p className="font-medium">{formData.maxCapacity} attendees</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Venue Type:</p>
                      <p className="font-medium capitalize">{formData.venueType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Visibility:</p>
                      <p className="font-medium capitalize">{formData.visibility}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">Description:</p>
                    <p className="text-sm mt-1">{formData.shortDescription || 'Not set'}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> This event will be saved as a draft. You can add ticket types, speakers, and schedule before publishing.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button onClick={() => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(currentStep + 1);
                  }
                }}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
