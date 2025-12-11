import { Clock, Tag, Sparkles, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ServicePackageCardProps {
  package: {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    imageUrl?: string | null;
    totalDurationMinutes: number;
    packagePriceInPaisa: number;
    regularPriceInPaisa: number;
    discountPercentage: number;
    services: Array<{
      id: string;
      name: string;
      durationMinutes: number;
      quantity?: number;
    }>;
    isFeatured?: number;
    gender?: string | null;
    validUntil?: string | null;
    maxBookingsPerDay?: number | null;
    availableDays?: string[] | null;
  };
  onSelect: (packageId: string) => void;
  onViewDetails: (packageId: string) => void;
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

export function ServicePackageCard({ package: pkg, onSelect, onViewDetails }: ServicePackageCardProps) {
  const savings = pkg.regularPriceInPaisa - pkg.packagePriceInPaisa;
  const isLimitedTime = pkg.validUntil && new Date(pkg.validUntil) > new Date();
  const daysRemaining = isLimitedTime 
    ? Math.ceil((new Date(pkg.validUntil!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg border-0 bg-white dark:bg-slate-900">
      <div className="relative">
        {pkg.imageUrl ? (
          <div className="h-40 overflow-hidden">
            <img 
              src={pkg.imageUrl} 
              alt={pkg.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white/80" />
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {pkg.isFeatured === 1 && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {pkg.category && (
            <Badge variant="secondary" className="shadow-md bg-white/90 backdrop-blur-sm">
              {pkg.category}
            </Badge>
          )}
          {pkg.gender && pkg.gender !== 'unisex' && (
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
              <Users className="w-3 h-3 mr-1" />
              {pkg.gender === 'male' ? "Men's" : "Women's"}
            </Badge>
          )}
        </div>

        {pkg.discountPercentage > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold shadow-lg">
              {pkg.discountPercentage}% OFF
            </Badge>
          </div>
        )}

        {isLimitedTime && daysRemaining && daysRemaining <= 7 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-1 text-white text-sm">
              <Calendar className="w-4 h-4" />
              <span>{daysRemaining === 1 ? 'Last day!' : `${daysRemaining} days left`}</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1">
            {pkg.name}
          </h3>
          {pkg.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {pkg.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {pkg.services.slice(0, 3).map((service) => (
            <Badge 
              key={service.id} 
              variant="outline" 
              className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              {service.name}{service.quantity && service.quantity > 1 ? ` ×${service.quantity}` : ''}
            </Badge>
          ))}
          {pkg.services.length > 3 && (
            <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
              +{pkg.services.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDuration(pkg.totalDurationMinutes)}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(pkg.packagePriceInPaisa)}
            </div>
            {savings > 0 && (
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(pkg.regularPriceInPaisa)}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  Save {formatCurrency(savings)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onViewDetails(pkg.id)}
          >
            View Details
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            onClick={() => onSelect(pkg.id)}
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
