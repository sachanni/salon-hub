import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarCheck, 
  Clock, 
  User, 
  Scissors,
  CreditCard,
  CheckCircle2,
  Loader2,
  Star
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  priceInPaisa: number | null;
  durationMinutes: number | null;
}

interface Suggestion {
  id: string;
  salon: {
    id: string;
    name: string;
    imageUrl: string | null;
    rating: number | null;
  };
  suggestedDate: string;
  suggestedTime: string;
  services: Service[];
  staff: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  estimatedTotal: number;
  reason: string;
  confidenceScore: number;
}

interface RebookConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  suggestion: Suggestion | null;
  isLoading: boolean;
}

function formatPrice(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export function RebookConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  suggestion,
  isLoading,
}: RebookConfirmationModalProps) {
  if (!suggestion) return null;

  const totalDuration = suggestion.services.reduce(
    (acc, service) => acc + (service.durationMinutes || 0),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Confirm Your Booking
          </DialogTitle>
          <DialogDescription>
            Review the details below and confirm your appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            {suggestion.salon.imageUrl ? (
              <img
                src={suggestion.salon.imageUrl}
                alt={suggestion.salon.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-base">{suggestion.salon.name}</h4>
              {suggestion.salon.rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{suggestion.salon.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium text-sm">
                  {format(parseISO(suggestion.suggestedDate), 'EEE, MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium text-sm">{suggestion.suggestedTime}</p>
              </div>
            </div>
          </div>

          {suggestion.staff && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              {suggestion.staff.photoUrl ? (
                <img
                  src={suggestion.staff.photoUrl}
                  alt={suggestion.staff.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Your Stylist</p>
                <p className="font-medium text-sm">{suggestion.staff.name}</p>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Services</p>
            <div className="space-y-2">
              {suggestion.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{service.name}</span>
                    {service.durationMinutes && (
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(service.durationMinutes)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {service.priceInPaisa ? formatPrice(service.priceInPaisa) : 'Free'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">{formatPrice(suggestion.estimatedTotal)}</p>
              {totalDuration > 0 && (
                <p className="text-xs text-muted-foreground">
                  Duration: {formatDuration(totalDuration)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Pay at Salon</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
