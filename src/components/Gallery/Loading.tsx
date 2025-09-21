import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const LoadingState: React.FC = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 overflow-hidden">
    <div className="w-full h-full relative">
      {/* Main image skeleton positioned exactly like real cards */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 will-change-transform">
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <div className="w-[85vw] sm:w-[70vw] md:w-[50vw] lg:w-[40vw] max-w-xl aspect-[2/3] relative">
            <Skeleton 
              className="absolute inset-0 w-full h-full" 
              shimmer 
              variant="rounded"
            />
            {/* Image title skeleton */}
            <div className="absolute bottom-4 left-4 right-4">
              <Skeleton className="h-6 w-32 mb-2" shimmer />
              <Skeleton className="h-4 w-20" shimmer />
            </div>
          </div>
        </div>
      </div>

      {/* Left/Right Navigation Button Skeletons */}
      <div className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-40">
        <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-full" shimmer />
      </div>
      
      <div className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40">
        <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-full" shimmer />
      </div>

      {/* Bottom Navigation Bar Skeleton */}
      <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-40">
        <div className="flex justify-center gap-4">
          {/* Action buttons */}
          <Skeleton className="w-12 h-12 rounded-full" shimmer />
          <Skeleton className="w-24 h-12 rounded-full" shimmer />
        </div>
        
        {/* Image Indicators Skeleton */}
        <div className="flex space-x-2 md:space-x-3 overflow-hidden px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton 
              key={index}
              className={`rounded-full ${index === 3 ? 'w-8 h-2 md:h-3' : 'w-2 h-2 md:h-3 md:w-3'}`}
              shimmer 
            />
          ))}
        </div>
      </div>

      {/* Loading text */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="text-center bg-black/20 backdrop-blur-sm px-6 py-3 rounded-full">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/80 text-sm font-medium">Discovering available images...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);