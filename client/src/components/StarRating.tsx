import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  label?: string;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  showValue = false,
  label,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoverValue || value);
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && setHoverValue(star)}
              onMouseLeave={() => !readonly && setHoverValue(0)}
              disabled={readonly}
              className={`transition-colors ${
                readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
              }`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isActive
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-gray-300"
                } transition-all`}
              />
            </button>
          );
        })}
        {showValue && value > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-600">
            {value.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
