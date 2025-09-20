import React from 'react';
import { Skeleton } from '../ui/Skeleton';

const GallerySkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 overflow-hidden">
      <div className="w-full h-full relative">
        {/* Main image display area skeleton */}
        <div className="relative h-full w-full flex items-center justify-center">
          <div className="relative w-full h-[85vh] md:h-[95vh] flex items-center justify-center">
            <div className="max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl">
              <Skeleton 
                className="w-[70vw] h-[80vh] max-w-4xl max-h-[90vh]" 
                shimmer 
                variant="rounded"
              />
            </div>
          </div>
        </div>
        
        {/* Navigation Controls Skeleton */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center justify-center gap-4 p-4 bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl">
            {/* Navigation buttons */}
            <Skeleton className="w-12 h-12 rounded-full" shimmer />
            <Skeleton className="w-12 h-12 rounded-full" shimmer />
            <Skeleton className="w-12 h-12 rounded-full" shimmer />
            
            {/* Indicators */}
            <div className="flex gap-2 mx-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton 
                  key={index}
                  className="w-2 h-2 rounded-full" 
                  shimmer 
                />
              ))}
            </div>
            
            {/* More controls */}
            <Skeleton className="w-12 h-12 rounded-full" shimmer />
            <Skeleton className="w-20 h-12 rounded-full" shimmer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GallerySkeleton;