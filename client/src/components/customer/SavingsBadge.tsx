import { TrendingDown, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function formatPrice(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
}

interface SavingsBadgeProps {
  originalPrice: number;
  adjustedPrice: number;
  discountPercent?: number;
  demandLevel?: 'low' | 'medium' | 'high' | 'peak';
  variant?: 'inline' | 'card' | 'compact';
  showPercentage?: boolean;
}

export function SavingsBadge({
  originalPrice,
  adjustedPrice,
  discountPercent,
  demandLevel,
  variant = 'inline',
  showPercentage = true,
}: SavingsBadgeProps) {
  const savings = originalPrice - adjustedPrice;
  const hasDiscount = savings > 0;
  const hasSurcharge = savings < 0;
  const actualPercent = Math.abs(discountPercent ?? Math.round((Math.abs(savings) / originalPrice) * 100));

  if (!hasDiscount && !hasSurcharge) {
    return null;
  }

  if (variant === 'compact') {
    if (hasDiscount) {
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          {showPercentage ? `-${actualPercent}%` : formatPrice(savings)}
        </Badge>
      );
    }
    const surchargeAmt = Math.abs(savings);
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
        <Zap className="h-3 w-3 mr-0.5" />
        +{formatPrice(surchargeAmt)} ({actualPercent}%)
      </Badge>
    );
  }

  if (variant === 'inline') {
    if (hasDiscount) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
          <TrendingDown className="h-4 w-4" />
          Save {formatPrice(savings)} ({actualPercent}%)
        </span>
      );
    }
    const surchargeAmt = Math.abs(savings);
    return (
      <span className="inline-flex items-center gap-1 text-orange-600 text-sm font-medium">
        <Zap className="h-4 w-4" />
        +{formatPrice(surchargeAmt)} ({actualPercent}%) peak
      </span>
    );
  }

  if (hasDiscount) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
          <Sparkles className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-700">
            Off-Peak Savings
          </div>
          <div className="text-xs text-emerald-600">
            You save {formatPrice(savings)} ({actualPercent}% off)
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs line-through text-muted-foreground">
            {formatPrice(originalPrice)}
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {formatPrice(adjustedPrice)}
          </div>
        </div>
      </div>
    );
  }

  const surchargeAmount = Math.abs(savings);
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
        <Zap className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-amber-700">
          Peak Time Pricing
        </div>
        <div className="text-xs text-amber-600">
          High demand - {formatPrice(surchargeAmount)} extra (+{actualPercent}%)
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs line-through text-muted-foreground">
          {formatPrice(originalPrice)}
        </div>
        <div className="text-lg font-bold text-amber-700">
          {formatPrice(adjustedPrice)}
        </div>
      </div>
    </div>
  );
}

interface PeakOffPeakIndicatorProps {
  demandLevel: 'low' | 'medium' | 'high' | 'peak';
  showLabel?: boolean;
}

export function PeakOffPeakIndicator({ demandLevel, showLabel = true }: PeakOffPeakIndicatorProps) {
  const config = {
    low: {
      label: 'Off-Peak',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      icon: Sparkles,
    },
    medium: {
      label: 'Normal',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: null,
    },
    high: {
      label: 'Busy',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      icon: Zap,
    },
    peak: {
      label: 'Peak',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: Zap,
    },
  };

  const { label, bgColor, textColor, icon: Icon } = config[demandLevel];

  return (
    <Badge variant="secondary" className={`${bgColor} ${textColor} hover:${bgColor}`}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {showLabel && label}
    </Badge>
  );
}
