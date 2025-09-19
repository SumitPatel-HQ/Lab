import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageKitImage as Image } from '../services/imageKitService';
import { preloadImageKit as preloadImage, IMAGEKIT_URL_ENDPOINT } from '../services/imageKitService';

// Helper function to get full ImageKit URL
const getImageKitUrl = (src: string): string => {
  if (src.startsWith('http')) {
    return src; // Already a full URL
  }
  return `${IMAGEKIT_URL_ENDPOINT}${src}`;
};

// Enhanced configuration for hover effects
const HOVER_CONFIG = {
  MAX_TILT: 5, // Maximum rotation in degrees (reduced for modal)
  SCALE_FACTOR: 1.02, // How much to scale up on hover (reduced for modal)
  TRANSITION_SPEED: 0.7, // Transition speed in seconds (matching ImageGrid.tsx)
  PERSPECTIVE: 1000, // Perspective value for 3D effect
  SHADOW_COLOR: 'rgba(0,0,0,0.3)', // Shadow color
};

interface ImageModalProps {
  image: Image | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  totalImages?: number;
  currentIndex?: number;
  enableTilt?: boolean; // Add new prop for tilt effect
  // Add props for adjacent images to preload
  prevImage?: Image | null;
  nextImage?: Image | null;
}

// Helper function to generate low-quality placeholder URL
const getPlaceholderUrl = (src: string): string => {
  const fullUrl = getImageKitUrl(src);
  // If src includes query parameters, add the placeholder params
  if (fullUrl.includes('?')) {
    return `${fullUrl}&w=20&q=10&blur=10`;
  } else {
    return `${fullUrl}?w=20&q=10&blur=10`;
  }
};

// Helper function to generate responsive image URLs
const getResponsiveSrcSet = (src: string): string => {
  // Extract base URL without query parameters
  const fullUrl = getImageKitUrl(src);
  const baseUrl = fullUrl.split('?')[0];
  
  // Return responsive srcSet
  return `
    ${baseUrl}?w=640&q=75 640w,
    ${baseUrl}?w=960&q=75 960w,
    ${baseUrl}?w=1280&q=80 1280w,
    ${baseUrl}?w=1920&q=80 1920w
  `.trim();
};

const SWIPE_THRESHOLD = 80; // Minimum distance in pixels to trigger a swipe
const SWIPE_RESISTANCE = 0.4; // Resistance factor for more natural swipe feeling
const DISMISS_THRESHOLD = 100; // Pixels needed to dismiss modal via drag
const DISMISS_VELOCITY_THRESHOLD = 0.5; // Velocity needed to dismiss modal
const ANIMATION_DURATION = 200; // Faster animation for better UX
const MAX_TILT = HOVER_CONFIG.MAX_TILT; // Maximum tilt angle for the modal image
// Add constants for dismiss animation
const DISMISS_ANIMATION_DURATION = 300; // How long the dismiss animation takes
const DISMISS_DISTANCE = window.innerHeight; // How far the image will travel when dismissed

const ImageModal: React.FC<ImageModalProps> = ({ 
  image, 
  onClose, 
  onPrev, 
  onNext,
  totalImages = 1,
  currentIndex = 0,
  enableTilt = true, // Default to enabled
  prevImage = null,
  nextImage = null
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
  
  // Add tilt effect state
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Add placeholder state
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number | null>(null);
  const lastTouchYRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
    setTiltX(0);
    setTiltY(0);
    setIsHovering(false);
    setPlaceholderLoaded(false);
    
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

  // Preload adjacent images for faster navigation
  useEffect(() => {
    if (!image) return;
    
    // Preload next and previous images in background for faster navigation
    const preloadAdjacentImages = async () => {
      // Use requestIdleCallback (or fallback to setTimeout) to preload during idle time
      const requestIdleCallbackPolyfill = 
        window.requestIdleCallback || 
        ((callback) => setTimeout(callback, 1));
      
      requestIdleCallbackPolyfill(() => {
        if (nextImage && nextImage.src) {
          preloadImage(nextImage.src);
        }
        
        if (prevImage && prevImage.src) {
          preloadImage(prevImage.src);
        }
      });
    };
    
    preloadAdjacentImages();
  }, [image, nextImage, prevImage]);

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
    // Only close if clicking directly on the modal backdrop
    // and not on any of its children
    if (e.target === e.currentTarget) {
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
      
      // Reset values to ensure clean state
      setIsDraggingVertical(false);
      setIsSwiping(false);
      setDragVelocityY(0);
      
      if (scale === 1) {
        // Enable tracking when not zoomed
        // We'll determine direction in the move event
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
          if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
            // Primarily vertical gesture - reduced threshold to make vertical detection more sensitive
            setIsDraggingVertical(true);
            setIsSwiping(false);
          } else if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            // Primarily horizontal gesture
            setIsSwiping(true);
            setIsDraggingVertical(false);
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
            
            // Apply cubic resistance to make drag feel more natural (increases resistance as you drag further)
            const resistFactor = 0.7 - (Math.min(deltaY, 300) / 1000);
            const resistedDeltaY = deltaY * resistFactor;
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
        animateDismiss();
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
      // Improved spring-like easing for more natural bounce effect
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
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

  // Add tilt effect handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!enableTilt || scale > 1 || isSwiping || isDraggingVertical) return;
    
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      
      // Calculate position relative to the center of the image
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
      
      // Set tilt values - opposite Y for natural feel
      setTiltX(-y * MAX_TILT);
      setTiltY(x * MAX_TILT);
    }
  };
  
  const handleMouseEnter = () => {
    if (!enableTilt || scale > 1) return;
    setIsHovering(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTiltX(0);
    setTiltY(0);
  };
  
  // Calculate the transform based on all active effects
  const getImageTransform = () => {
    let transform = '';
    
    // Apply perspective for 3D effect
    transform += `perspective(${HOVER_CONFIG.PERSPECTIVE}px) `;
    
    // Apply scale if zoomed or hovering
    if (scale !== 1) {
      transform += `scale(${scale}) `;
    } else if (isHovering && enableTilt) {
      transform += `scale(${HOVER_CONFIG.SCALE_FACTOR}) `;
    } else if (isDraggingVertical) {
      // Add subtle scale reduction when dragging down
      const dragProgress = Math.min(dragY / 300, 1);
      const scaleReduction = 1 - (dragProgress * 0.1); // Scale down to 0.9 at most
      transform += `scale(${scaleReduction}) `;
    }
    
    // Apply horizontal swipe offset
    if (swipeOffset !== 0) {
      transform += `translateX(${swipeOffset}px) `;
    }
    
    // Apply vertical drag
    if (dragY !== 0) {
      transform += `translateY(${dragY}px) `;
    }
    
    // Apply tilt when hovering and tilt is enabled
    if (isHovering && enableTilt && scale === 1 && !isSwiping && !isDraggingVertical) {
      transform += `rotateX(${tiltX}deg) rotateY(${tiltY}deg) `;
    }
    
    return transform;
  };
  
  // Calculate transition styles based on state
  const getImageTransition = () => {
    if (isSwiping || isDraggingVertical) {
      // No transition during active swiping or dragging
      return 'none';
    } else if (isHovering && enableTilt) {
      // Very quick transition during hover for responsiveness
      return 'transform 0.05s linear';
    }
    
    // Smooth transition when returning to resting position
    return `transform ${HOVER_CONFIG.TRANSITION_SPEED}s ease-out`;
  };

  // Calculate shadow style based on state
  const getImageShadow = () => {
    if (isHovering && enableTilt && scale === 1 && !isSwiping && !isDraggingVertical) {
      return `0 20px 40px -10px ${HOVER_CONFIG.SHADOW_COLOR}`;
    }
    return '0 10px 30px -15px rgba(0,0,0,0.2)';
  };

  // Add new animation for dismissal with spring effect
  const animateDismiss = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    const startY = dragY;
    const startTime = performance.now();
    const duration = DISMISS_ANIMATION_DURATION;
    
    const animateDismissEffect = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for natural acceleration 
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Calculate new position with increasing speed
      const newY = startY + (DISMISS_DISTANCE - startY) * easeProgress;
      
      setDragY(newY);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animateDismissEffect);
      } else {
        // Animation complete, close the modal
        animationFrameIdRef.current = null;
        onClose();
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animateDismissEffect);
  };

  if (!image) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[15px]"
      onClick={handleBackgroundClick}
    >
      <div className="absolute inset-0 animate-modal-in" />
      
      <div 
        className={`relative max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl transform transition-transform duration-300 ease-in-out will-change-transform`}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : 'none',
          opacity: dragY ? Math.max(1 - (dragY / 300), 0.3) : 1, // Increased opacity change for better feedback
          transition: isDraggingVertical ? 'none' : 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 300ms ease', // Spring curve for reset
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
        
        {/* Image container */}
        <div 
          ref={imageContainerRef}
          className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            willChange: 'transform',
            userSelect: 'none'
          }}
        >
          {image && (
            <div 
              className={`w-full h-full flex items-center justify-center relative bg-black/50 rounded-xl overflow-hidden`}
              style={{
                transform: getImageTransform(),
                transition: getImageTransition(),
                boxShadow: getImageShadow(),
                willChange: isHovering || isDraggingVertical || isSwiping ? 'transform, box-shadow' : 'auto'
              }}
            >
              {/* LQIP (Low Quality Image Placeholder) */}
              {!loaded && image.src && (
                <img
                  src={getPlaceholderUrl(image.src)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain blur-sm opacity-60 transition-opacity duration-300"
                  onLoad={() => setPlaceholderLoaded(true)}
                  style={{
                    opacity: loaded ? 0 : (placeholderLoaded ? 0.6 : 0)
                  }}
                />
              )}

              {/* Image loading indicator - display until LQIP loads */}
              {!loaded && !placeholderLoaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-900/80 text-white px-4 py-2 rounded-md">
                    Failed to load image
                  </div>
                </div>
              )}
              
              {/* Image */}
              {image.src && (
                <img
                  ref={imageRef}
                  src={getImageKitUrl(image.src)}
                  srcSet={getResponsiveSrcSet(image.src)}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, (max-width: 1280px) 70vw, 60vw"
                  alt={image.title || "Image"}
                  className={`max-w-full max-h-[90vh] object-contain transition-opacity duration-300 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                  } ${isAnimating ? 'animate-fade-in' : ''}`}
                  loading="eager" 
                  fetchPriority="high"
                  decoding="async"
                  draggable={false}
                  onLoad={() => setLoaded(true)}
                  onError={() => setError(true)}
                />
              )}

              {/* Invisible preload images for next/previous images */}
              {prevImage && prevImage.src && (
                <link rel="preload" as="image" href={getImageKitUrl(prevImage.src)} />
              )}
              {nextImage && nextImage.src && (
                <link rel="preload" as="image" href={getImageKitUrl(nextImage.src)} />
              )}
            </div>
          )}
          
          
          {/* Image title with gradient background */}
          {image && image.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-12 pb-4 px-6">
              <h3 className="text-left text-gray-400 text-lg font-small">{image.title}</h3>
            </div>
          )}
          
          {/* Swipe direction indicators */}
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
          
          
        </div>
      </div>
    </div>
  );
};

export default ImageModal;