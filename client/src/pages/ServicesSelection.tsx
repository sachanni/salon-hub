import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceInPaisa: number;
  category: string;
  imageUrl?: string | null;
}

interface Salon {
  id: string;
  name: string;
  city: string;
  state: string;
  rating: string;
  reviewCount: number;
}

const ServicesSelection: React.FC = () => {
  const [, setLocation] = useLocation();
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const salonId = urlParams.get('salonId') || '';

  const { data: salon } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: async (): Promise<Salon> => {
      if (!salonId) throw new Error('No salon ID provided');
      const response = await fetch(`/api/salons/${salonId}`);
      if (!response.ok) throw new Error('Failed to fetch salon');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: services } = useQuery({
    queryKey: ['salon-services', salonId],
    queryFn: async (): Promise<Service[]> => {
      if (!salonId) return [];
      const response = await fetch(`/api/salons/${salonId}/services`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!salonId,
  });

  const serviceCategories = services 
    ? Array.from(new Set(services.map(s => s.category)))
    : [];

  const filteredServices = selectedCategory
    ? services?.filter(s => s.category === selectedCategory)
    : services;

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const calculateTotal = () => {
    if (!services) return { price: 0, duration: 0 };
    
    const selectedServicesList = services.filter(s => selectedServices.has(s.id));
    const totalPriceInPaisa = selectedServicesList.reduce((sum, s) => sum + s.priceInPaisa, 0);
    const totalDuration = selectedServicesList.reduce((sum, s) => sum + s.durationMinutes, 0);
    
    return { price: totalPriceInPaisa / 100, duration: totalDuration };
  };

  const handleContinue = () => {
    if (selectedServices.size === 0) return;
    
    const serviceIds = Array.from(selectedServices).join(',');
    setLocation(`/booking?salonId=${salonId}&serviceIds=${serviceIds}`);
  };

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50">
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation(`/salon-profile?id=${salonId}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Services</h1>
                {salon && (
                  <p className="text-sm text-gray-600">
                    {salon.name} • {salon.city}, {salon.state}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {serviceCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f7 #f3f4f6' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all",
                !selectedCategory
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white text-gray-700 border hover:border-gray-300"
              )}
            >
              Featured
            </button>
            {serviceCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all",
                  selectedCategory === category
                    ? "bg-gray-900 text-white shadow-lg"
                    : "bg-white text-gray-700 border hover:border-gray-300"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {selectedCategory || 'Featured'}
          </h2>
        </div>

        <div className="space-y-3 mb-24">
          {filteredServices?.map((service) => {
            const isSelected = selectedServices.has(service.id);
            
            return (
              <Card 
                key={service.id} 
                onClick={() => toggleService(service.id)}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isSelected 
                    ? "ring-2 ring-purple-500 bg-purple-50/50" 
                    : "hover:shadow-md"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {service.imageUrl && (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        data-testid={`img-service-select-${service.id}`}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {service.durationMinutes} min {service.category && `• ${service.category}`}
                      </p>
                      <div className="text-base font-semibold text-gray-900">
                        ₹{service.priceInPaisa / 100}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div 
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                          isSelected 
                            ? "bg-purple-600 border-purple-600" 
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedServices.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{total.price}
                  </span>
                  {selectedServices.size > 1 && (
                    <span className="text-sm text-gray-600">
                      for {selectedServices.size} services
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{total.duration} mins total</span>
                </div>
              </div>
              
              <Button
                onClick={handleContinue}
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white px-8"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSelection;
