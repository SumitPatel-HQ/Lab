import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeIndicatorsProps {
  swipeDirection: 'left' | 'right' | null;
  isSwiping?: boolean;
}

export const SwipeIndicators: React.FC<SwipeIndicatorsProps> = React.memo(({ swipeDirection, isSwiping = false }) => {
  // Only show indicators during active swiping to avoid conflict with modal controls
  if (!isSwiping || !swipeDirection) return null;

  return (
    <>
      {swipeDirection === 'left' && (
        <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 text-white/90 z-30 pointer-events-none">
          <div className="bg-white/20 rounded-full p-3 backdrop-blur-md border border-white/20 shadow-lg">
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </div>
      )}
      
      {swipeDirection === 'right' && (
        <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 text-white/90 z-30 pointer-events-none">
          <div className="bg-white/20 rounded-full p-3 backdrop-blur-md border border-white/20 shadow-lg">
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </div>
      )}
    </>
  );
});