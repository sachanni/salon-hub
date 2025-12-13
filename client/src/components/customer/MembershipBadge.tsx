import { Badge } from "@/components/ui/badge";
import { Crown, Percent, CreditCard, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembershipBadgeProps {
  planType?: 'discount' | 'credit' | 'packaged';
  planName?: string;
  status?: 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const planTypeIcons = {
  discount: Percent,
  credit: CreditCard,
  packaged: Package,
};

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  grace_period: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusLabels = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  expired: 'Expired',
  grace_period: 'Grace Period',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export default function MembershipBadge({
  planType,
  planName,
  status = 'active',
  size = 'md',
  showIcon = true,
  className,
}: MembershipBadgeProps) {
  const PlanIcon = planType ? planTypeIcons[planType] : Crown;
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  if (status !== 'active') {
    return (
      <Badge
        variant="outline"
        className={cn(
          statusColors[status],
          sizeClasses[size],
          'font-medium',
          className
        )}
      >
        {showIcon && <Crown className={cn(iconSize, 'mr-1')} />}
        {planName ? `${planName} (${statusLabels[status]})` : statusLabels[status]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-gradient-to-r from-amber-100 to-purple-100 text-amber-800 border-amber-200',
        sizeClasses[size],
        'font-medium',
        className
      )}
    >
      {showIcon && <PlanIcon className={cn(iconSize, 'mr-1')} />}
      {planName || 'Member'}
    </Badge>
  );
}

export function MembershipStatusBadge({
  status,
  size = 'sm',
}: {
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Badge
      variant="outline"
      className={cn(statusColors[status], sizeClasses[size], 'font-medium')}
    >
      {statusLabels[status]}
    </Badge>
  );
}
