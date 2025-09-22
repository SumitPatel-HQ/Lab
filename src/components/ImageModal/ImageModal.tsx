import React, { useEffect, useCallback } from 'react';
import type { ImageKitImage as Image } from '../../services/ImageKit';
import { useGestures } from '../../hooks/useGestures';
import { useTransform } from '../../hooks/useTransform';
import { useImageState } from '../../hooks/useImageState';
import { ModalControls } from './ModalControls';
import { ImageContainer } from './ImageContainer';

interface ImageModalProps {
  image: Image | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  totalImages?: number;
  currentIndex?: number;
  enableTilt?: boolean;
  prevImage?: Image | null;
  nextImage?: Image | null;
}

const ImageModal: React.FC<ImageModalProps> = React.memo(({ 
  image, 
  onClose, 
  onPrev, 
  onNext,
  enableTilt = true,
  prevImage = null,
  nextImage = null
}) => {
  // Custom hooks for different concerns
  const { loadingState, handlers: loadingHandlers } = useImageState(image, prevImage, nextImage);
  
  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right' && onPrev) {
      onPrev();
    } else if (direction === 'left' && onNext) {
      onNext();
    }
  }, [onPrev, onNext]);

  const { swipeState, dragState, touchHandlers, cleanup } = useGestures({
    onSwipeComplete: handleSwipeComplete,
    onDismiss: onClose,
 // Will be updated with zoom state later if needed
  });

  const transform = useTransform({
    enableTilt,
    swipeOffset: swipeState.offset,
    dragY: dragState.y,
    isDragging: dragState.isDragging,
    isSwiping: swipeState.isSwiping,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      cleanup();
    };
  }, [onClose, onPrev, onNext, cleanup]);

  // Background click handler
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[15px]"
      onClick={handleBackgroundClick}
      style={{ 
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <div className="absolute inset-0 animate-modal-in" />
      
      <div 
        className="relative max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl transform transition-transform duration-300 ease-in-out will-change-transform"
        style={{
          transform: dragState.y ? `translateY(${dragState.y}px)` : 'none',
          opacity: dragState.y ? Math.max(1 - (dragState.y / 300), 0.3) : 1,
          transition: dragState.isDragging ? 'none' : 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 300ms ease',
        }}
      >
        <ModalControls
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
          isSwiping={swipeState.isSwiping}
        />
        
        <ImageContainer
          image={image}
          loadingState={loadingState}
          swipeState={swipeState}
          imageTransform={transform.imageTransform}
          imageTransition={transform.imageTransition}
          imageShadow={transform.imageShadow}
          willChange={transform.willChange}
          prevImage={prevImage}
          nextImage={nextImage}
          touchHandlers={touchHandlers}
          mouseHandlers={transform.handlers}
          loadingHandlers={loadingHandlers}
        />
      </div>
    </div>
  );
});

ImageModal.displayName = 'ImageModal';

export default ImageModal;