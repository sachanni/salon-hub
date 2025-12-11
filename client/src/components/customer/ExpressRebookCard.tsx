import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  CalendarCheck, 
  Clock, 
  Sparkles, 
  X, 
  ChevronRight,
  User,
  Scissors,
  MapPin,
  Star
} from 'lucide-react';
import { RebookConfirmationModal } from './RebookConfirmationModal';

interface ExpressRebookSuggestion {
  id: string;
  salon: {
    id: string;
    name: string;
    imageUrl: string | null;
    rating: number | null;
  };
  suggestedDate: string;
  suggestedTime: string;
  services: Array<{
    id: string;
    name: string;
    priceInPaisa: number | null;
    durationMinutes: number | null;
  }>;
  staff: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  estimatedTotal: number;
  reason: string;
  confidenceScore: number;
  slotAvailable: boolean;
  status: string;
  expiresAt: string;
}

interface LastVisit {
  salonId: string;
  salonName: string;
  salonImageUrl: string | null;
  lastVisitDate: string;
  daysSince: number;
  services: string[];
  staffName: string | null;
}

interface SuggestionsResponse {
  suggestions: ExpressRebookSuggestion[];
  lastVisits: LastVisit[];
}

function formatPrice(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
}

export function ExpressRebookCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSuggestion, setSelectedSuggestion] = useState<ExpressRebookSuggestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<SuggestionsResponse>({
    queryKey: ['express-rebook-suggestions'],
    queryFn: async () => {
      const response = await fetch('/api/express-rebook/suggestions', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const quickBookMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const response = await fetch('/api/express-rebook/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ suggestionId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Booking Confirmed!',
        description: `Your appointment at ${data.booking.salonName} is confirmed for ${format(parseISO(data.booking.date), 'MMM d')} at ${data.booking.time}`,
      });
      queryClient.invalidateQueries({ queryKey: ['express-rebook-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsModalOpen(false);
      setSelectedSuggestion(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async ({ suggestionId, reason }: { suggestionId: string; reason?: string }) => {
      const response = await fetch('/api/express-rebook/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ suggestionId, reason }),
      });
      if (!response.ok) {
        throw new Error('Failed to dismiss');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['express-rebook-suggestions'] });
    },
  });

  const handleQuickBook = (suggestion: ExpressRebookSuggestion) => {
    setSelectedSuggestion(suggestion);
    setIsModalOpen(true);
  };

  const handleConfirmBook = () => {
    if (selectedSuggestion) {
      quickBookMutation.mutate(selectedSuggestion.id);
    }
  };

  const handleDismiss = (suggestionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissMutation.mutate({ suggestionId, reason: 'not_now' });
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const { suggestions, lastVisits } = data;

  if (suggestions.length === 0 && lastVisits.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mb-6 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Book Again</CardTitle>
              <CardDescription>One-tap rebooking based on your preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="relative p-4 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={(e) => handleDismiss(suggestion.id, e)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Dismiss suggestion"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {suggestion.salon.imageUrl ? (
                    <img
                      src={suggestion.salon.imageUrl}
                      alt={suggestion.salon.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-base truncate">{suggestion.salon.name}</h4>
                      {suggestion.salon.rating && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span>{suggestion.salon.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={suggestion.confidenceScore >= 80 ? 'default' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {suggestion.confidenceScore}% match
                    </Badge>
                  </div>

                  <p className="text-sm text-primary font-medium mt-1">
                    {suggestion.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" />
                      <span>{format(parseISO(suggestion.suggestedDate), 'EEE, MMM d')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{suggestion.suggestedTime}</span>
                    </div>
                    {suggestion.staff && (
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{suggestion.staff.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {suggestion.services.slice(0, 2).map((service) => (
                      <Badge key={service.id} variant="outline" className="text-xs">
                        {service.name}
                      </Badge>
                    ))}
                    {suggestion.services.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{suggestion.services.length - 2} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-base font-semibold">
                      {formatPrice(suggestion.estimatedTotal)}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickBook(suggestion)}
                      disabled={!suggestion.slotAvailable || quickBookMutation.isPending}
                      className="gap-1"
                    >
                      {suggestion.slotAvailable ? (
                        <>
                          Book Now
                          <ChevronRight className="h-4 w-4" />
                        </>
                      ) : (
                        'Slot Unavailable'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {suggestions.length === 0 && lastVisits.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your recent salons - book again anytime:
              </p>
              {lastVisits.slice(0, 3).map((visit) => (
                <div
                  key={visit.salonId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {visit.salonImageUrl ? (
                      <img
                        src={visit.salonImageUrl}
                        alt={visit.salonName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{visit.salonName}</p>
                      <p className="text-xs text-muted-foreground">
                        {visit.daysSince} days ago • {visit.services.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = `/salons/${visit.salonId}/book`}
                  >
                    Book
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RebookConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSuggestion(null);
        }}
        onConfirm={handleConfirmBook}
        suggestion={selectedSuggestion}
        isLoading={quickBookMutation.isPending}
      />
    </>
  );
}
