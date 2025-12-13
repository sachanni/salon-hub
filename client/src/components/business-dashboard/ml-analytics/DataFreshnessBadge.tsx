import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { format, parseISO, differenceInHours } from "date-fns";

interface DataFreshnessBadgeProps {
  dataFreshness?: string;
}

export function DataFreshnessBadge({ dataFreshness }: DataFreshnessBadgeProps) {
  if (!dataFreshness) return null;

  const freshDate = parseISO(dataFreshness);
  const hoursDiff = differenceInHours(new Date(), freshDate);
  
  const isFresh = hoursDiff < 6;
  const isStale = hoursDiff > 24;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${
        isFresh ? 'border-emerald-300 text-emerald-600' : 
        isStale ? 'border-amber-300 text-amber-600' : 
        'border-gray-300 text-gray-600'
      }`}
    >
      <RefreshCw className="h-3 w-3" />
      Updated {format(freshDate, "MMM d, h:mm a")}
    </Badge>
  );
}
