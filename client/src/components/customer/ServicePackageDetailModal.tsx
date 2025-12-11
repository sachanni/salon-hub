import { useState } from "react";
import { 
  Clock, 
  Tag, 
  Sparkles, 
  Users, 
  Calendar, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  Timer
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PackageService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceInPaisa: number;
  sequenceOrder: number;
  quantity?: number;
}

interface PackageDetail {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  totalDurationMinutes: number;
  packagePriceInPaisa: number;
  regularPriceInPaisa: number;
  discountPercentage: number;
  services: PackageService[];
  isFeatured?: number;
  gender?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  availableDays?: string[] | null;
  availableTimeStart?: string | null;
  availableTimeEnd?: string | null;
  minAdvanceBookingHours?: number | null;
  maxBookingsPerDay?: number | null;
  savings: number;
  savingsFormatted: string;
  salon?: {
    id: string;
    name: string;
  };
}

interface ServicePackageDetailModalProps {
  package: PackageDetail | null;
  open: boolean;
  onClose: () => void;
  onBook: (packageId: string) => void;
}

function formatCurrency(paisa: number): string {
  const rupees = paisa / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function ServicePackageDetailModal({ 
  package: pkg, 
  open, 
  onClose, 
  onBook 
}: ServicePackageDetailModalProps) {
  if (!pkg) return null;

  const isLimitedTime = pkg.validUntil && new Date(pkg.validUntil) > new Date();
  const daysRemaining = isLimitedTime 
    ? Math.ceil((new Date(pkg.validUntil!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const hasTimeRestrictions = pkg.availableTimeStart && pkg.availableTimeEnd;
  const hasDayRestrictions = pkg.availableDays && pkg.availableDays.length > 0 && pkg.availableDays.length < 7;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          {pkg.imageUrl ? (
            <div className="h-48 overflow-hidden">
              <img 
                src={pkg.imageUrl} 
                alt={pkg.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-white/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {pkg.isFeatured === 1 && (
              <Badge className="bg-amber-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {pkg.discountPercentage > 0 && (
              <Badge className="bg-green-500 text-white font-bold">
                {pkg.discountPercentage}% OFF
              </Badge>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-xl font-bold">{pkg.name}</h2>
            {pkg.salon && (
              <p className="text-white/80 text-sm">{pkg.salon.name}</p>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-12rem)]">
          <div className="p-6 space-y-6">
            {pkg.description && (
              <p className="text-slate-600 dark:text-slate-300">
                {pkg.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{formatDuration(pkg.totalDurationMinutes)}</span>
              </div>
              {pkg.category && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">{pkg.category}</span>
                </div>
              )}
              {pkg.gender && pkg.gender !== 'unisex' && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{pkg.gender === 'male' ? "Men's" : "Women's"}</span>
                </div>
              )}
            </div>

            {(isLimitedTime || hasTimeRestrictions || hasDayRestrictions || pkg.minAdvanceBookingHours) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>Booking Restrictions</span>
                </div>
                <ul className="text-sm text-amber-600 dark:text-amber-300 space-y-1 ml-6">
                  {isLimitedTime && daysRemaining && (
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {daysRemaining === 1 ? 'Expires today!' : `${daysRemaining} days remaining`}
                    </li>
                  )}
                  {hasDayRestrictions && (
                    <li>Available on {pkg.availableDays!.join(', ')}</li>
                  )}
                  {hasTimeRestrictions && (
                    <li className="flex items-center gap-2">
                      <Timer className="w-3 h-3" />
                      {formatTime(pkg.availableTimeStart!)} - {formatTime(pkg.availableTimeEnd!)}
                    </li>
                  )}
                  {pkg.minAdvanceBookingHours && (
                    <li>Book at least {pkg.minAdvanceBookingHours} hours in advance</li>
                  )}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Included Services ({pkg.services.reduce((sum, s) => sum + (s.quantity || 1), 0)} total)
              </h3>
              <div className="space-y-2">
                {pkg.services
                  .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                  .map((service, index) => (
                  <div 
                    key={service.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        {service.name}
                        {service.quantity && service.quantity > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            ×{service.quantity}
                          </Badge>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDuration(service.durationMinutes * (service.quantity || 1))}
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        {formatCurrency(service.priceInPaisa * (service.quantity || 1))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Regular price ({pkg.services.reduce((sum, s) => sum + (s.quantity || 1), 0)} services)</span>
                <span className="line-through">{formatCurrency(pkg.regularPriceInPaisa)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Package discount ({pkg.discountPercentage}%)
                </span>
                <span>-{formatCurrency(pkg.savings)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900 dark:text-white">Package Price</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(pkg.packagePriceInPaisa)}
                </span>
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold"
              onClick={() => onBook(pkg.id)}
            >
              Book This Package
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
