import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ModalControlsProps {
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export const ModalControls: React.FC<ModalControlsProps> = React.memo(({ onClose, onPrev, onNext }) => (
  <>
    <button 
      className="absolute top-2 right-2 z-50 p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 focus:bg-black/70 transition-colors shadow-lg"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      aria-label="Close modal"
    >
      <X className="w-6 h-6" />
    </button>
    
    {onPrev && (
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-all hover:scale-110 hidden sm:flex opacity-70 hover:opacity-100 shadow-lg"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>
    )}
    
    {onNext && (
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-all hover:scale-110 hidden sm:flex opacity-70 hover:opacity-100 shadow-lg"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>
    )}
  </>
));