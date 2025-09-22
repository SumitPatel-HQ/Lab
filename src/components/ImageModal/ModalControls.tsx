import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ModalControlsProps {
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  isSwiping?: boolean;
}

export const ModalControls: React.FC<ModalControlsProps> = React.memo(({ onClose, onPrev, onNext, isSwiping = false }) => (
  <>
    <button 
      className={`absolute  top-2 right-2 z-50 p-3 sm:p-2 bg-black/50 text-white rounded-full backdrop-blur-xs hover:bg-black/70 active:bg-black/70 focus:bg-black/70 transition-all shadow-lg touch-manipulation ${isSwiping ? 'opacity-30' : 'opacity-100'}`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      aria-label="Close modal"
      
    >
      <X className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
    
    {onPrev && (
      <button 
        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 active:bg-black/70 transition-all hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg touch-manipulation ${isSwiping ? 'opacity-20' : 'opacity-70 hover:opacity-100 active:opacity-100'}`}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        aria-label="Previous image"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
      </button>
    )}
    
    {onNext && (
      <button 
        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 active:bg-black/70 transition-all hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg touch-manipulation ${isSwiping ? 'opacity-20' : 'opacity-70 hover:opacity-100 active:opacity-100'}`}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        aria-label="Next image"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
      </button>
    )}
  </>
));