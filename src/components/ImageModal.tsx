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
const DISMISS_THRESHOLD = 100; // Pixels needed to dismiss modal via drag
const DISMISS_VELOCITY_THRESHOLD = 0.5; // Velocity needed to dismiss modal
const ANIMATION_DURATION = 200; // Faster animation for better UX

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
  
  // Add vertical drag state for dismiss gesture
  const [dragY, setDragY] = useState(0);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [dragVelocityY, setDragVelocityY] = useState(0);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number | null>(null);
  const lastTouchYRef = useRef<number | null>(null);
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
    setDragY(0);
    setIsDraggingVertical(false);
    
    // Cancel any pending animation frames
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Start a new image changed animation
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_DURATION);
    
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
    } else if (e.touches.length === 1) {
      // Single touch for swiping (horizontal) or dismissing (vertical)
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = performance.now();
      lastTouchTimeRef.current = performance.now();
      lastTouchYRef.current = e.touches[0].clientY;
      
      if (scale === 1) {
        // Only enable swiping when not zoomed
        setIsSwiping(true);
      }
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
      } else if (touchStartXRef.current !== null && touchStartYRef.current !== null) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartXRef.current;
        const deltaY = currentY - touchStartYRef.current;
        
        // Determine if this is primarily a horizontal or vertical gesture
        if (!isSwiping && !isDraggingVertical) {
          if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
            // Primarily vertical gesture
            setIsDraggingVertical(true);
          } else if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            // Primarily horizontal gesture
            setIsSwiping(true);
          }
        }
        
        if (isDraggingVertical) {
          // Handle vertical drag for modal dismissal (only allow downward dragging)
          if (deltaY > 0) {
            // Calculate velocity for momentum effect
            if (lastTouchYRef.current !== null && lastTouchTimeRef.current !== null) {
              const timeDelta = performance.now() - lastTouchTimeRef.current;
              if (timeDelta > 0) {
                const instantVelocity = (currentY - lastTouchYRef.current) / timeDelta;
                setDragVelocityY(instantVelocity);
              }
            }
            
            // Apply resistance to make drag feel more natural
            const resistedDeltaY = Math.min(deltaY * 0.5, window.innerHeight * 0.3);
            setDragY(resistedDeltaY);
            
            // Update last position and time
            lastTouchYRef.current = currentY;
            lastTouchTimeRef.current = performance.now();
            
            // Prevent default to stop page scrolling
            e.preventDefault();
          }
        } else if (isSwiping) {
          // Handle horizontal swipe for navigation
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
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Reset pinch zoom state
    setInitialTouchDistance(null);
    
    // Handle vertical dismiss gesture
    if (isDraggingVertical) {
      // If velocity is high enough or dragged far enough, dismiss modal
      if (dragVelocityY > DISMISS_VELOCITY_THRESHOLD || dragY > DISMISS_THRESHOLD) {
        onClose();
      } else {
        // Not enough movement, animate back to center
        animateVerticalReset();
      }
      
      setIsDraggingVertical(false);
    }
    // Handle swipe gesture completion
    else if (isSwiping && touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartXRef.current;
      const touchDuration = performance.now() - (touchStartTimeRef.current || 0);
      
      // Calculate swipe velocity for better UX
      const velocity = Math.abs(deltaX) / touchDuration;
      const isQuickSwipe = velocity > 0.5;
      
      // Apply different threshold for quick swipes vs slow drags
      const effectiveThreshold = isQuickSwipe ? SWIPE_THRESHOLD * 0.7 : SWIPE_THRESHOLD;
      
      // Animate swipe back to center or complete the transition
      if (Math.abs(deltaX) >= effectiveThreshold || isQuickSwipe) {
        // Complete the swipe with a smooth animation
        animateSwipeCompletion(deltaX > 0 ? 'right' : 'left');
        
        // Wait for animation before triggering navigation
        setTimeout(() => {
          if (deltaX > 0 && onPrev) {
            onPrev();
          } else if (deltaX < 0 && onNext) {
            onNext();
          }
        }, 100); // Faster transition
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
    touchStartYRef.current = null;
    touchStartTimeRef.current = null;
    lastTouchYRef.current = null;
    lastTouchTimeRef.current = null;
    setIsSwiping(false);
  };

  // Smooth animation for vertical reset
  const animateVerticalReset = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    const startY = dragY;
    const startTime = performance.now();
    const duration = ANIMATION_DURATION;
    
    const animateReset = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Spring-like easing for natural feel
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Calculate new position
      const newY = startY * (1 - easeProgress);
      
      setDragY(newY);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animateReset);
      } else {
        // Animation complete
        setDragY(0);
        animationFrameIdRef.current = null;
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animateReset);
  };

  // Smooth animation for swipe reset
  const animateSwipeReset = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    const startOffset = swipeOffset;
    const startTime = performance.now();
    const duration = ANIMATION_DURATION;
    
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
    const duration = 100; // Even shorter duration for completion
    
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
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[15px] flex items-center justify-center p-4 md:p-8"
      onClick={handleBackgroundClick}
    >
      <div className="absolute inset-0 animate-modal-in" />
      
      <div 
        className={`relative max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl transform transition-transform duration-300 ease-in-out will-change-transform`}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : 'none',
          opacity: dragY ? Math.max(1 - (dragY / 400), 0.3) : 1
        }}
      >
        <button 
          className="absolute top-2 right-2 z-50 p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 focus:bg-black/70 transition-colors shadow-lg"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-all hover:scale-110 hidden sm:flex opacity-70 hover:opacity-100 shadow-lg"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-all hover:scale-110 hidden sm:flex opacity-70 hover:opacity-100 shadow-lg"
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
          className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-black shadow-3xl"
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
                transition: scale === 1 && !isSwiping ? 'transform 0.2s ease-out' : 'none',
                willChange: 'transform'
              }}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              draggable={false}
            />
          )}
          
          {/* Image caption with gradient background for better visibility */}
          {image.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-12 pb-4 px-4">
              <h3 className="text-gray-400 text-left md:text-left font-small ">{image.title}</h3>
              {(image as any).caption && (
                <p className="text-white/80 text-sm mt-1 text-center md:text-left">{(image as any).caption}</p>
              )}
            </div>
          )}
        </div>
        
        {/* {totalImages > 1 && (
          <div className="absolute top-4 left-4 pointer-events-none">
            <p className="text-white/90 text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              {currentIndex + 1} / {totalImages}
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ImageModal;