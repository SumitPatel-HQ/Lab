import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Image } from '../services/imageService';

interface ImageModalProps {
  image: Image | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  totalImages?: number;
  currentIndex?: number;
}

const SWIPE_THRESHOLD = 80; // Minimum distance in pixels to trigger a swipe
const SWIPE_RESISTANCE = 0.4; // Resistance factor for more natural swipe feeling

const ImageModal: React.FC<ImageModalProps> = ({ 
  image, 
  onClose, 
  onPrev, 
  onNext,
  totalImages = 1,
  currentIndex = 0
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Reset state when image changes
  useEffect(() => {
    setScale(1);
    setPositionX(0);
    setPositionY(0);
    setLoaded(false);
    setError(false);
    setSwipeOffset(0);
    setIsSwiping(false);
    setSwipeDirection(null);
    
    // Cancel any pending animation frames
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Start a new image changed animation
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [image]);

  // Close modal when escape key is pressed
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
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  // Handle background click to close modal
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Touch event handlers with improved swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Calculate the distance between two touch points for pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialTouchDistance(distance);
      setInitialScale(scale);
    } else if (e.touches.length === 1 && scale === 1) {
      // Single touch for swiping (only when not zoomed)
      touchStartXRef.current = e.touches[0].clientX;
      touchStartTimeRef.current = Date.now();
      setIsSwiping(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistance !== null) {
      // Handle pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const newScale = Math.max(1, Math.min(initialScale * (distance / initialTouchDistance), 4));
      setScale(newScale);
      
      // Prevent default to stop page scrolling/zooming
      e.preventDefault();
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        // Pan the image when zoomed in
        // Pan logic would go here
        e.preventDefault();
      } else if (isSwiping && touchStartXRef.current !== null) {
        // Handle horizontal swipe for navigation
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartXRef.current;
        
        // Apply resistance to make swipe feel more natural
        const resistedDeltaX = deltaX * SWIPE_RESISTANCE;
        
        // Update the swipe offset for visual feedback
        setSwipeOffset(resistedDeltaX);
        
        // Determine swipe direction for visual indicators
        if (deltaX > 10) {
          setSwipeDirection('right');
        } else if (deltaX < -10) {
          setSwipeDirection('left');
        } else {
          setSwipeDirection(null);
        }
        
        // Prevent default to stop page scrolling
        if (Math.abs(deltaX) > 10) {
          e.preventDefault();
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Reset pinch zoom state
    setInitialTouchDistance(null);
    
    // Handle swipe gesture completion
    if (isSwiping && touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartXRef.current;
      const touchDuration = Date.now() - (touchStartTimeRef.current || 0);
      
      // Calculate swipe velocity for better UX
      const velocity = Math.abs(deltaX) / touchDuration;
      const isQuickSwipe = velocity > 0.5;
      
      // Apply different threshold for quick swipes vs slow drags
      const effectiveThreshold = isQuickSwipe ? SWIPE_THRESHOLD * 0.7 : SWIPE_THRESHOLD;
      
      // Animate swipe back to center or complete the transition
      if (Math.abs(deltaX) >= effectiveThreshold) {
        // Complete the swipe with a smooth animation
        animateSwipeCompletion(deltaX > 0 ? 'right' : 'left');
        
        // Wait for animation before triggering navigation
        setTimeout(() => {
          if (deltaX > 0 && onPrev) {
            onPrev();
          } else if (deltaX < 0 && onNext) {
            onNext();
          }
        }, 150);
      } else {
        // Not enough movement, animate back to center
        animateSwipeReset();
      }
    }
    
    // If scale is close to 1, snap back to 1
    if (scale < 1.1) {
      setScale(1);
      setPositionX(0);
      setPositionY(0);
    }
    
    // Reset touch state
    touchStartXRef.current = null;
    touchStartTimeRef.current = null;
    setIsSwiping(false);
  };

  // Smooth animation for swipe reset
  const animateSwipeReset = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    const startOffset = swipeOffset;
    const startTime = performance.now();
    const duration = 300;
    
    const animateReset = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Use easeOutQuad easing function for smooth deceleration
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      
      // Calculate new offset
      const newOffset = startOffset * (1 - easeProgress);
      
      setSwipeOffset(newOffset);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animateReset);
      } else {
        // Animation complete
        setSwipeOffset(0);
        setSwipeDirection(null);
        animationFrameIdRef.current = null;
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animateReset);
  };

  // Smooth animation for completing a swipe
  const animateSwipeCompletion = (direction: 'left' | 'right') => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    const startOffset = swipeOffset;
    const targetOffset = direction === 'right' ? window.innerWidth : -window.innerWidth;
    const startTime = performance.now();
    const duration = 150; // Shorter duration for completion
    
    const animateCompletion = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Use easeInQuad for acceleration
      const easeProgress = progress * progress;
      
      // Calculate new offset
      const newOffset = startOffset + (targetOffset - startOffset) * easeProgress;
      
      setSwipeOffset(newOffset);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animateCompletion);
      } else {
        // Animation complete
        animationFrameIdRef.current = null;
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animateCompletion);
  };

  // Handle mouse wheel for zoom on desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.max(1, Math.min(scale - e.deltaY * 0.01, 4));
    setScale(newScale);
  };

  // Double click to zoom in/out
  const handleDoubleClick = () => {
    setScale(scale === 1 ? 2 : 1);
    if (scale !== 1) {
      setPositionX(0);
      setPositionY(0);
    }
  };

  if (!image) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      <div className="absolute inset-0 animate-modal-in" />
      
      <button 
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Navigation buttons - visible on larger screens and on hover */}
      {onPrev && (
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-all hover:scale-110 hidden sm:flex opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {onNext && (
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-all hover:scale-110 hidden sm:flex opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
      
      {/* Swipe direction indicators */}
      {swipeDirection === 'left' && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-40 text-white/30 sm:hidden">
          <ChevronRight className="w-12 h-12" />
        </div>
      )}
      
      {swipeDirection === 'right' && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 text-white/30 sm:hidden">
          <ChevronLeft className="w-12 h-12" />
        </div>
      )}
      
      <div 
        className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center overflow-hidden will-change-transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {error ? (
          <div className="p-8 bg-gray-800 rounded-lg">
            <p className="text-white">Failed to load image</p>
          </div>
        ) : (
          <img
            ref={imageRef}
            src={image.src}
            alt={image.title}
            className={`max-h-[90vh] max-w-full object-contain transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            } ${isAnimating ? 'animate-image-zoom-in' : ''}`}
            style={{
              transform: `translateX(${swipeOffset}px) scale(${scale}) translate(${positionX}px, ${positionY}px)`,
              transformOrigin: 'center',
              transition: scale === 1 && !isSwiping ? 'transform 0.3s ease-out' : 'none',
              willChange: 'transform'
            }}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            draggable={false}
          />
        )}
        
        {totalImages > 1 && (
          <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/70 text-sm bg-black/30 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
              {currentIndex + 1} / {totalImages}
            </p>
          </div>
        )}
        
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <p className="text-white bg-black/50 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
            {image.title}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;