import { cn } from "../../lib/utils";
import * as React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape of the skeleton */
  variant?: "default" | "circle" | "rounded" | "square";
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Animation type for the skeleton */
  animation?: "pulse" | "wave" | "none";
  /** Whether to show a shimmer effect */
  shimmer?: boolean;
  /** Number of skeleton items to display */
  count?: number;
}

function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animation = "pulse",
  shimmer = false,
  count = 1,
  ...props
}: SkeletonProps) {
  // Variant classes
  const variantClasses = {
    default: "rounded-md",
    circle: "rounded-full",
    rounded: "rounded-xl",
    square: "rounded-none"
  };

  // Animation classes
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: ""
  };

  // Style object for width and height
  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
    ...props.style
  };

  // Render multiple skeleton items if count > 1
  if (count > 1) {
    return (
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "bg-gray-800/80 relative overflow-hidden",
              variantClasses[variant],
              animationClasses[animation],
              shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
            )}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-gray-800/80 relative overflow-hidden",
        variantClasses[variant],
        animationClasses[animation],
        shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Image Card Skeleton component for the ImageGrid
function ImageCardSkeleton({ aspectRatio = "2:3" }: { aspectRatio?: "2:3" | "3:2" }) {
  return (
    <div className="group relative cursor-pointer">
      <div className="relative overflow-hidden rounded-lg shadow-md">
        <div className={`${aspectRatio === '2:3' ? 'pb-[150%]' : 'pb-[66.67%]'} bg-gray-800 relative`}>
          <Skeleton 
            className="absolute inset-0 w-full h-full" 
            shimmer 
            variant="square"
          />
        </div>
        {/* Title skeleton at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <Skeleton className="h-4 w-3/4" shimmer />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, ImageCardSkeleton };