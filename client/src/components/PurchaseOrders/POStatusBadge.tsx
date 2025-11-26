import { Badge } from "@/components/ui/badge";

export type POStatus = 'draft' | 'confirmed' | 'delivered' | 'received';

interface POStatusBadgeProps {
  status: POStatus;
}

export function POStatusBadge({ status }: POStatusBadgeProps) {
  const variants: Record<POStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'outline',
    confirmed: 'default',
    delivered: 'secondary',
    received: 'destructive',
  };

  const labels: Record<POStatus, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    delivered: 'Delivered',
    received: 'Received',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
