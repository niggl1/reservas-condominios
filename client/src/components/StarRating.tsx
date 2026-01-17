import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showLabel?: boolean;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showLabel = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const labels = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            disabled={!interactive}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                index < rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {showLabel && rating > 0 && (
        <span className="text-sm text-muted-foreground ml-2">
          {labels[rating - 1]}
        </span>
      )}
    </div>
  );
}

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
}

export function RatingDisplay({ rating, totalReviews, size = "md" }: RatingDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(rating)} size={size} />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {totalReviews !== undefined && (
        <span className="text-muted-foreground text-sm">
          ({totalReviews} {totalReviews === 1 ? "avaliação" : "avaliações"})
        </span>
      )}
    </div>
  );
}
