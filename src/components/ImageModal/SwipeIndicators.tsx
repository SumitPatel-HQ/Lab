import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeIndicatorsProps {
  swipeDirection: 'left' | 'right' | null;
}

export const SwipeIndicators: React.FC<SwipeIndicatorsProps> = React.memo(({ swipeDirection }) => (
  <>
    {swipeDirection === 'left' && (
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">
        <ChevronLeft className="w-12 h-12" />
      </div>
    )}
    
    {swipeDirection === 'right' && (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70">
        <ChevronRight className="w-12 h-12" />
      </div>
    )}
  </>
));