import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
}

const OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {OPTIONS.map(option => (
        <Button
          key={option.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-all",
            value === option.value
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
