import React from 'react';
import { ImageCardSkeleton } from '../ui/Skeleton';

interface GridSkeletonProps {
  layoutMode: 'grid' | 'masonry';
  gridDensity: number;
  count?: number;
}

const GridSkeleton: React.FC<GridSkeletonProps> = ({ 
  layoutMode, 
  gridDensity, 
  count = 12 
}) => {
  // Grid classes based on density (same as your ImageGrid component)
  const getGridClass = () => {
    if (layoutMode === 'masonry') {
      switch (gridDensity) {
        case 1: return 'columns-1 sm:columns-2';
        case 2: return 'columns-2 sm:columns-3';
        case 3: return 'columns-2 sm:columns-3 lg:columns-4';
        case 4: return 'columns-3 sm:columns-4 lg:columns-5';
        case 5: return 'columns-4 sm:columns-5 lg:columns-6';
        default: return 'columns-2 sm:columns-3 lg:columns-4';
      }
    }
    
    switch (gridDensity) {
      case 1: return 'grid-cols-1 sm:grid-cols-2';
      case 2: return 'grid-cols-2 sm:grid-cols-3';
      case 3: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
      case 4: return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5';
      case 5: return 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-6';
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getGapClass = () => {
    switch (gridDensity) {
      case 1: return 'gap-6';
      case 2: return 'gap-5';
      case 3: return 'gap-4';
      case 4: return 'gap-3';
      case 5: return 'gap-2';
      default: return 'gap-4';
    }
  };

  // Generate mixed aspect ratios for more realistic skeleton
  const getRandomAspectRatio = (index: number): "2:3" | "3:2" => {
    // Use deterministic random based on index for consistent layout
    return (index * 7) % 3 === 0 ? '3:2' : '2:3';
  };

  return (
    <div 
      className={`${
        layoutMode === 'grid' 
          ? `grid ${getGridClass()} ${getGapClass()}` 
          : `${getGridClass()} gap-4`
      } w-full`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className={`${layoutMode === 'masonry' ? 'mb-4 break-inside-avoid' : ''}`}
        >
          <ImageCardSkeleton aspectRatio={getRandomAspectRatio(index)} />
        </div>
      ))}
    </div>
  );
};

export default GridSkeleton;