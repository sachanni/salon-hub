import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp, Sparkles, Clock, AlertCircle } from 'lucide-react';

type DemandLevel = 'low' | 'medium' | 'high' | 'peak';

interface SlotPricing {
  time: string;
  available: boolean;
  demand: DemandLevel;
  pricing: {
    originalPriceInPaisa: number;
    adjustedPriceInPaisa: number;
    discountPercent: number;
    discountLabel: string | null;
    savings: string | null;
    appliedRuleId: string | null;
  };
}

interface SlotPricingResponse {
  date: string;
  dayOfWeek: string;
  overallDemand: DemandLevel;
  slots: SlotPricing[];
}

function formatPrice(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
}

interface SlotPricingCardProps {
  salonId: string;
  date: string;
  serviceId?: string;
  onSlotSelect?: (time: string, slot: SlotPricing) => void;
  selectedTime?: string;
  showUnavailable?: boolean;
}

export function SlotPricingCard({ 
  salonId, 
  date, 
  serviceId, 
  onSlotSelect,
  selectedTime,
  showUnavailable = false
}: SlotPricingCardProps) {
  const { data, isLoading, error } = useQuery<SlotPricingResponse>({
    queryKey: ['slot-pricing', salonId, date, serviceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceId) params.append('serviceId', serviceId);
      
      const response = await fetch(
        `/api/dynamic-pricing/salons/${salonId}/slots/${date}/pricing?${params}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!salonId && !!date,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data || !data.slots?.length) {
    return null;
  }

  const slotsToShow = showUnavailable ? data.slots : data.slots.filter(s => s.available);

  if (slotsToShow.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No available slots for this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-3">
        {data.dayOfWeek} - {data.overallDemand === 'low' ? 'Off-peak day' : data.overallDemand === 'peak' ? 'Busy day' : 'Regular day'}
      </div>
      
      {slotsToShow.map((slot) => {
        const hasDiscount = slot.pricing.adjustedPriceInPaisa < slot.pricing.originalPriceInPaisa;
        const hasSurcharge = slot.pricing.adjustedPriceInPaisa > slot.pricing.originalPriceInPaisa;
        const discountAmount = hasDiscount 
          ? slot.pricing.originalPriceInPaisa - slot.pricing.adjustedPriceInPaisa
          : 0;
        const surchargeAmount = hasSurcharge
          ? slot.pricing.adjustedPriceInPaisa - slot.pricing.originalPriceInPaisa
          : 0;
        const discountPercent = hasDiscount 
          ? Math.round((discountAmount / slot.pricing.originalPriceInPaisa) * 100)
          : 0;
        const surchargePercent = hasSurcharge
          ? Math.round((surchargeAmount / slot.pricing.originalPriceInPaisa) * 100)
          : 0;
        const isSelected = selectedTime === slot.time;
        
        return (
          <button
            key={slot.time}
            onClick={() => slot.available && onSlotSelect?.(slot.time, slot)}
            disabled={!slot.available}
            className={`w-full p-3 rounded-lg border transition-all text-left ${
              !slot.available
                ? 'border-border bg-muted opacity-50 cursor-not-allowed'
                : isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-foreground">{slot.time}</span>
                </div>
                
                {slot.demand === 'low' && slot.available && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Off-Peak
                  </Badge>
                )}
                {slot.demand === 'peak' && slot.available && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Peak
                  </Badge>
                )}
                {!slot.available && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                    Booked
                  </Badge>
                )}
              </div>
              
              {slot.available && (
                <div className="flex items-center gap-2">
                  {hasDiscount && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Save {formatPrice(discountAmount)} ({discountPercent}%)
                      </span>
                    </div>
                  )}
                  {hasSurcharge && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        +{formatPrice(surchargeAmount)} ({surchargePercent}%) peak
                      </span>
                    </div>
                  )}
                  
                  <div className="text-right">
                    {hasDiscount ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm line-through text-muted-foreground">
                          {formatPrice(slot.pricing.originalPriceInPaisa)}
                        </span>
                        <span className="text-base font-semibold text-emerald-600">
                          {formatPrice(slot.pricing.adjustedPriceInPaisa)}
                        </span>
                      </div>
                    ) : hasSurcharge ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm line-through text-muted-foreground">
                          {formatPrice(slot.pricing.originalPriceInPaisa)}
                        </span>
                        <span className="text-base font-semibold text-orange-600">
                          {formatPrice(slot.pricing.adjustedPriceInPaisa)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-semibold">
                        {formatPrice(slot.pricing.originalPriceInPaisa)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {slot.pricing.discountLabel && slot.available && (
              <p className="mt-1 text-xs text-muted-foreground">{slot.pricing.discountLabel}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
