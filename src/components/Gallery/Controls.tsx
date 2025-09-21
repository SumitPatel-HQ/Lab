import React from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Library } from 'lucide-react';

interface ControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onRandom: () => void;
  onOpenGrid: () => void;
  onLoadAll: () => void;
  loading: boolean;
  currentIndex: number;
  visibleIndicators: number[];
  onIndicatorClick: (index: number) => void;
}

const Controls: React.FC<ControlsProps> = React.memo(({
  onPrev,
  onNext,
  onRandom,
  onOpenGrid,
  currentIndex,
  visibleIndicators,
  onIndicatorClick
}) => {
  return (
    <>
      {/* Left/Right Navigation Buttons */}
      <button 
        className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xs text-white/60 hover:bg-black/60 transition-all duration-300 shadow-xl hover:scale-110"
        onClick={onPrev}
        aria-label="Previous image"
      >
        <ChevronLeft className="w-7 h-7 md:w-10 md:h-10" />
      </button>
      
      <button 
        className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-xs text-white/60 hover:bg-black/60 transition-all duration-300 shadow-xl hover:scale-110"
        onClick={onNext}
        aria-label="Next image"
      >
        <ChevronRight className="w-7 h-7 md:w-10 md:h-10" />
      </button>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-40">
        <div className="flex justify-center gap-4">
          <button 
            onClick={onRandom}
            className="p-3 rounded-full bg-black/30 hover:bg-black/50 text-white/80 backdrop-blur-xs transition-all duration-300 hover:scale-105 shadow-lg"
            aria-label="Random image"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onOpenGrid}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/30 backdrop-blur-xs text-white/80 hover:bg-black/40 transition-all duration-300 hover:scale-105 shadow-lg"
            aria-label="View library"
          >
            <Library className="w-5 h-5" />
            <span className="font-medium">Library</span>
          </button>
          
        
        </div>
        
        {/* Image Indicators */}
        <div className="flex space-x-2 md:space-x-3 overflow-hidden px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
          {visibleIndicators.map(index => (
            <button
              key={index}
              onClick={() => onIndicatorClick(index)}
              className={`rounded-full transition-all duration-300 ${
                currentIndex === index 
                  ? 'bg-white/60 w-8 h-2 md:h-3' 
                  : 'bg-white/20 hover:bg-white/70 w-2 h-2 md:h-3 md:w-3'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
});

export default Controls;
