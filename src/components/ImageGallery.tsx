// local image gallery
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Library } from 'lucide-react';
import ImageCard from './ImageCard';
import ImageGrid from './ImageGrid';
import { getAllImages, type Image as ImageType } from '../services/imageService';

const MAX_VISIBLE_INDICATORS = 8; // Maximum number of indicators to show
const PRELOAD_IMAGES = 3; // Preload nearby images
const SWIPE_THRESHOLD = 8; // Extremely minimal distance needed to trigger a swipe
const VELOCITY_THRESHOLD = 0.02; // Detect even the slightest movement
const SWIPE_RESISTANCE = 0.2; // Very low resistance for immediate movement
const MAX_ROTATION_ANGLE = 8; // Slightly reduced rotation for faster perception
const SPRING_ANIMATION_DURATION = 100; // Ultra-fast spring reset
const SWIPE_EXIT_DURATION = 100; // Ultra-fast exit animation (100ms)
const NEXT_CARD_VISIBILITY_THRESHOLD = 0.1; // Show next card after just 10% of swipe progress

const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<number | null>(null);
  const [visibleImageIndices, setVisibleImageIndices] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [preloadedSrc, setPreloadedSrc] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const prevIndexRef = useRef(currentIndex);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const lastTouchRef = useRef<{x: number, y: number} | null>(null);
  const velocityXRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const imagesLoaded = useRef(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const screenWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);
  const swipeDirectionRef = useRef<'left' | 'right' | null>(null);

  // Use memo to prevent unnecessary re-renders of image data
  const getImages = useCallback(async () => {
    try {
      const allImages = getAllImages();
      setImages(allImages);
      imagesLoaded.current = true;
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }, []);

  useEffect(() => {
    getImages();
    
    // Set screen width on mount and on resize
    const handleResize = () => {
      screenWidthRef.current = window.innerWidth;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getImages]);

  // Calculate which images should be visible based on current index
  useEffect(() => {
    if (images.length === 0) return;
    
    // Priority: current image + immediately adjacent ones
    const highPriorityIndices = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length
    ];
    
    // Secondary: other preload images
    const secondaryIndices = [];
    for (let i = 2; i <= PRELOAD_IMAGES; i++) {
      const prevIndex = (currentIndex - i + images.length) % images.length;
      const nextIndex = (currentIndex + i) % images.length;
      secondaryIndices.push(prevIndex, nextIndex);
    }
    
    setVisibleImageIndices([...highPriorityIndices, ...secondaryIndices]);
  }, [currentIndex, images.length]);

  const handleScroll = useCallback(() => {
    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
    }

    const scrollPosition = window.scrollY;
    if (scrollPosition > 100) {
      const timeout = window.setTimeout(() => {
        setHideTimeout(null);
      }, 4000);
      setHideTimeout(timeout);
    } else {
      setHideTimeout(null);
    }
  }, [hideTimeout]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [handleScroll, hideTimeout]);

  // Add transition animation when changing slides
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 120); // Ultra-fast transition
      
      prevIndexRef.current = currentIndex;
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  // Clean up any animations when component unmounts
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Preload images function
  const preloadImage = useCallback((src: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }, []);

  // Preload current and adjacent images when they change
  useEffect(() => {
    if (images.length === 0 || visibleImageIndices.length === 0) return;
    
    // Preload visible images
    const preloadPromises = visibleImageIndices.slice(0, 3).map(index => 
      preloadImage(images[index].src)
    );
    
    Promise.all(preloadPromises).catch(() => {
      // Silently handle any preloading errors
    });
  }, [visibleImageIndices, images, preloadImage]);

  // Preload the active image whenever it changes
  useEffect(() => {
    if (images.length === 0) return;
    
    // Force preload the current image
    const currentImageSrc = images[currentIndex].src;
    setPreloadedSrc(currentImageSrc);
    
    const preloader = new Image();
    preloader.src = currentImageSrc;
    
    // Also preload adjacent images in the background
    const preloadAdjacent = () => {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      const nextIndex = (currentIndex + 1) % images.length;
      
      const prevImage = new Image();
      prevImage.src = images[prevIndex].src;
      
      const nextImage = new Image();
      nextImage.src = images[nextIndex].src;
    };
    
    // Preload after a small delay
    const timer = setTimeout(preloadAdjacent, 200);
    
    return () => clearTimeout(timer);
  }, [currentIndex, images]);

  const prevImage = () => {
    if (isTransitioning) return; // Prevent rapid clicking
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    if (isTransitioning) return; // Prevent rapid clicking
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Improved random image function
  const randomImage = () => {
    // Prevent clicking if already transitioning or loading
    if (isTransitioning || shuffleLoading) return;
    
    // Set loading state to show spinner
    setShuffleLoading(true);
    
    // Clear any existing preloaded image
    setPreloadedSrc(null);
    
    // Find a new random index
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * images.length);
    } while (newIndex === currentIndex && images.length > 1);
    
    // Store the new image source
    const newImageSrc = images[newIndex].src;
    
    // Force the browser to load the image before proceeding
    const imgLoader = new Image();
    
    // After the image is loaded, update the state
    imgLoader.onload = () => {
      // Mark that the image is preloaded and store its source
      setPreloadedSrc(newImageSrc);
      
      // Update visible indices for adjacent images
      const adjacentIndices = [
        newIndex,
        (newIndex + 1) % images.length,
        (newIndex - 1 + images.length) % images.length
      ];
      setVisibleImageIndices(adjacentIndices);
      
      // Update with requestAnimationFrame for smoother transitions
      requestAnimationFrame(() => {
        // Start the transition animation 
        setIsTransitioning(true);
        
        // Wait again to ensure the animation is applied
        requestAnimationFrame(() => {
          // Update the current index to show the new image
          setCurrentIndex(newIndex);
          
          // Clear the loading state
          setShuffleLoading(false);
        });
      });
    };
    
    // If image fails to load, still try to show it
    imgLoader.onerror = () => {
      console.warn('Failed to preload image, attempting to show anyway');
      
      setIsTransitioning(true);
      setCurrentIndex(newIndex); 
      setShuffleLoading(false);
    };
    
    // Start loading the image
    imgLoader.src = newImageSrc;
  };

  // Optimized touch start with pre-initialization
  const onTouchStart = (e: React.TouchEvent) => {
    // Prevent handling touch if we're in a transition
    if (isTransitioning) return;
    
    // Cancel any ongoing animation
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    const touch = e.targetTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = performance.now();
    velocityXRef.current = 0;
    
    // Pre-initialize swipe direction based on touch position for faster response
    const screenCenter = screenWidthRef.current / 2;
    const initialDirection = touch.clientX < screenCenter ? 'left' : 'right';
    swipeDirectionRef.current = initialDirection;
    setSwipeDirection(initialDirection);
    
    setIsDragging(true);
    setDragOffset(0);
    setDragY(0);
    setSwipeProgress(0.1); // Start with slight progress to show next card immediately
  };

  // Ultra-responsive touch move with minimal detection
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) return;
    
    // Always prevent default
    e.preventDefault();
    
    const touch = e.targetTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    
    // Immediate velocity calculation with heavy weighting on current movement
    if (lastTouchRef.current !== null) {
      const timeDelta = Math.max(1, performance.now() - (touchStartTimeRef.current || performance.now()));
      const instantVelocityX = (touch.clientX - lastTouchRef.current.x) / timeDelta;
      // Almost entirely based on current movement
      velocityXRef.current = velocityXRef.current * 0.1 + instantVelocityX * 0.9;
    }
    
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Apply minimal resistance for extremely responsive feel
    const resistedDeltaX = deltaX * SWIPE_RESISTANCE;
    
    // Update direction immediately for any movement
    const direction = deltaX < 0 ? 'left' : 'right';
    swipeDirectionRef.current = direction;
    setSwipeDirection(direction);
    
    // Calculate progress with very little movement required
    const progress = Math.min(Math.abs(deltaX) / (screenWidthRef.current * 0.15), 1);
    
    // Check if we've moved enough to auto-complete the swipe
    if (progress > 0.5 || Math.abs(velocityXRef.current) > VELOCITY_THRESHOLD * 2) {
      // Auto-complete swipe if we've moved halfway or have sufficient velocity
      animateSwipeCompletion(direction);
      return;
    }
    
    // Update UI directly
    setSwipeProgress(progress);
    setDragOffset(resistedDeltaX);
  };

  // Instant swipe completion with minimal animation
  const animateSwipeCompletion = (direction: 'left' | 'right') => {
    // Cancel any ongoing touch handling
    setIsDragging(false);
    
    const startOffset = dragOffset;
    const targetOffset = direction === 'left' ? -screenWidthRef.current * 0.5 : screenWidthRef.current * 0.5;
    const startTime = performance.now();
    const duration = SWIPE_EXIT_DURATION;
    
    // Set direction for entrance animation
    setSwipeDirection(direction);
    
    // Directly compute next index
    const nextIndex = direction === 'left' 
      ? (currentIndex + 1) % images.length 
      : (currentIndex - 1 + images.length) % images.length;
    
    // Preload the next image immediately
    if (images[nextIndex]) {
      const img = new Image();
      img.src = images[nextIndex].src;
    }
    
    // Ultra-fast, simplified animation function
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Linear animation for speed - minimal easing
      setSwipeProgress(progress);
      setDragOffset(startOffset + (targetOffset - startOffset) * progress);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Skip any further animations, immediately set new index
        setDragOffset(0);
        setDragY(0);
        setSwipeProgress(0);
        setSwipeDirection(null);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
        
        // Set index directly
        setCurrentIndex(nextIndex);
      }
    };
    
    // Skip animation entirely for extremely small movements
    if (Math.abs(startOffset) < 5 && Math.abs(velocityXRef.current) > VELOCITY_THRESHOLD) {
      // Immediately change image without animation
      setDragOffset(0);
      setDragY(0);
      setSwipeProgress(0);
      setSwipeDirection(null);
      swipeDirectionRef.current = null;
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      setCurrentIndex(nextIndex);
    } else {
      // Very brief animation for larger movements
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  };

  // Reset with minimal animation
  const animateSpringReset = () => {
    const startOffset = dragOffset;
    const startTime = performance.now();
    const duration = SPRING_ANIMATION_DURATION;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simple quadratic ease-out for speed
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      
      // Batch state updates
      setDragOffset(startOffset * (1 - easedProgress));
      setSwipeProgress(swipeProgress * (1 - easedProgress));
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Reset everything immediately
        setDragOffset(0);
        setDragY(0);
        setSwipeProgress(0);
        setSwipeDirection(null);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  // Ultra-fast touch end handler
  const onTouchEnd = () => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) {
      setIsDragging(false);
      return;
    }
    
    const touchEnd = lastTouchRef.current;
    if (!touchEnd) {
      setIsDragging(false);
      return;
    }
    
    const deltaX = touchEnd.x - touchStartRef.current.x;
    const totalMovement = Math.abs(deltaX);
    
    // Detect even minimal swipes and quick taps
    const velocity = Math.abs(velocityXRef.current);
    const isQuickSwipe = velocity > VELOCITY_THRESHOLD;
    const isTinyMovement = totalMovement <= SWIPE_THRESHOLD;
    
    setIsDragging(false);
    
    // Complete swipe with extremely low threshold
    // Even a tiny movement should trigger if it's quick enough
    if (totalMovement >= SWIPE_THRESHOLD || isQuickSwipe) {
      // For extremely small movements, use direction based on screen position
      const direction = isTinyMovement && isQuickSwipe 
        ? (touchEnd.x < screenWidthRef.current / 2 ? 'left' : 'right')
        : (deltaX < 0 ? 'left' : 'right');
      
      animateSwipeCompletion(direction);
    } else {
      // Only reset if there's significant offset
      if (Math.abs(dragOffset) > 5) {
        animateSpringReset();
      } else {
        // Skip reset animation entirely for tiny movements
        setDragOffset(0);
        setDragY(0);
        setSwipeProgress(0);
        setSwipeDirection(null);
        swipeDirectionRef.current = null;
      }
    }
    
    // Reset touch tracking
    touchStartRef.current = null;
    lastTouchRef.current = null;
    touchStartTimeRef.current = null;
    velocityXRef.current = 0;
  };

  // For keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGrid) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGrid, isTransitioning]);

  // Calculate visible indicators
  const visibleIndicators = React.useMemo(() => {
    if (images.length <= MAX_VISIBLE_INDICATORS) {
      return images.map((_, i) => i);
    }

    const halfCount = Math.floor(MAX_VISIBLE_INDICATORS / 2);
    let startIndex = currentIndex - halfCount;
    let endIndex = currentIndex + halfCount;

    // Adjust if we're near the beginning
    if (startIndex < 0) {
      endIndex -= startIndex; // Add the overflow to end
      startIndex = 0;
    }

    // Adjust if we're near the end
    if (endIndex >= images.length) {
      startIndex = Math.max(0, startIndex - (endIndex - images.length + 1));
      endIndex = images.length - 1;
    }

    // Make sure we don't exceed our desired count
    if (endIndex - startIndex + 1 > MAX_VISIBLE_INDICATORS) {
      endIndex = startIndex + MAX_VISIBLE_INDICATORS - 1;
    }

    return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i);
  }, [currentIndex, images.length]);

  // High-performance transform style for active card
  const getActiveCardTransform = () => {
    if (!isDragging || dragOffset === 0) return '';
    
    // Calculate rotation proportionally to swipe distance
    const rotationFactor = Math.min(Math.abs(dragOffset) / (screenWidthRef.current * 0.3), 1);
    const rotationAngle = MAX_ROTATION_ANGLE * rotationFactor * (dragOffset > 0 ? 1 : -1);
    
    // Apply hardware acceleration with translateZ for better performance
    return `translate3d(${dragOffset}px, 0, 0) rotate(${rotationAngle}deg)`;
  };

  // Improved adjacent card transform with earlier appearance
  const getAdjacentCardTransform = (index: number) => {
    if (!swipeDirection || swipeProgress === 0) return '';
    
    const isNext = (swipeDirection === 'left' && index === (currentIndex + 1) % images.length) ||
                 (swipeDirection === 'right' && index === (currentIndex - 1 + images.length) % images.length);
    
    if (isNext) {
      // Start with larger initial scale for better visibility
      const scale = 0.9 + (0.1 * swipeProgress);
      
      // More pronounced movement for next card
      const xOffset = swipeDirection === 'left' ? 
        25 - (25 * swipeProgress) : // Coming from right
        -25 + (25 * swipeProgress); // Coming from left
      
      // Add slight shadow/depth for better visual hierarchy
      return `translate3d(${xOffset}px, 0, 0) scale(${scale})`;
    }
    
    return '';
  };

  if (showGrid) {
    return <ImageGrid images={images} onClose={() => setShowGrid(false)} />;
  }

  return (
    <div 
      ref={galleryRef}
      className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 overflow-hidden"
    >
      <div 
        className={`w-full h-full relative ${isTransitioning ? 'pointer-events-none' : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative h-full w-full flex items-center justify-center">
          <button 
            className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 shadow-xl hover:scale-110"
            onClick={prevImage}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-7 h-7 md:w-10 md:h-10" />
          </button>
          
          <button 
            className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 shadow-xl hover:scale-110"
            onClick={nextImage}
            aria-label="Next image"
          >
            <ChevronRight className="w-7 h-7 md:w-10 md:h-10" />
          </button>
          
          <div className="relative w-full h-[85vh] md:h-[95vh] flex items-center justify-center">
            {visibleImageIndices.map(index => {
              const isActive = index === currentIndex;
              const isAdjacent = Math.abs(index - currentIndex) === 1 ||
                                 (currentIndex === 0 && index === images.length - 1) ||
                                 (currentIndex === images.length - 1 && index === 0);
              
              // Higher z-index for active and adjacent cards
              const zIndex = isActive ? 30 : (isAdjacent ? 25 : 10);
              
              // More visible adjacent cards - show them even with minimal swipe
              const isNextCard = (swipeDirection === 'left' && index === (currentIndex + 1) % images.length) ||
                                (swipeDirection === 'right' && index === (currentIndex - 1 + images.length) % images.length);
              
              // Show adjacent cards as soon as there's minimal swipe movement
              const shouldShowAdjacent = swipeProgress > NEXT_CARD_VISIBILITY_THRESHOLD && isNextCard;
              
              // Determine transform style based on card state
              const cardStyle: React.CSSProperties = {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translateX(0)',
                willChange: (isDragging && isActive) || shouldShowAdjacent ? 'transform' : 'auto',
                zIndex,
                // More dramatic opacity change for next card
                opacity: isActive ? 1 : (shouldShowAdjacent ? 
                          0.6 + (swipeProgress * 0.4) : (isAdjacent ? 0.5 : 0.3))
              };
              
              // Apply transforms based on card state
              if (isActive) {
                if (isDragging) {
                  cardStyle.transform = getActiveCardTransform();
                }
              } else if (isDragging && isNextCard) {
                // Always calculate adjacent transform if dragging
                const adjacentTransform = getAdjacentCardTransform(index);
                if (adjacentTransform) {
                  cardStyle.transform = adjacentTransform;
                }
              }
              
              return (
                <div 
                  key={images[index].id}
                  style={cardStyle}
                  className="transition-transform duration-200 ease-out"
                >
                  <ImageCard 
                    key={images[index].id}
                    image={images[index]}
                    index={index}
                    activeIndex={currentIndex}
                    totalImages={images.length}
                    isPreloaded={preloadedSrc === images[index].src}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Fixed bottom navigation bar */}
        <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-40">
          {/* Control buttons moved above indicators */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={randomImage}
              disabled={shuffleLoading}
              className={`p-3 rounded-full ${
                shuffleLoading 
                  ? 'bg-black/30 text-gray-400' 
                  : 'bg-black/40 hover:bg-black/60 text-white'
              } backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg`}
              aria-label="Random image"
            >
              {shuffleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Shuffle className="w-5 h-5" />
              )}
            </button>
            
            <button 
              onClick={() => setShowGrid(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 hover:scale-105 shadow-lg"
              aria-label="View library"
            >
              <Library className="w-5 h-5" />
              <span className="font-medium">Library</span>
            </button>
          </div>
          
          {/* Enhanced image indicators moved below buttons */}
          <div className="flex space-x-2 md:space-x-3 overflow-hidden px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
            {visibleIndicators.map(index => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  currentIndex === index 
                    ? 'bg-white w-8 h-2 md:h-3' 
                    : 'bg-white/40 hover:bg-white/70 w-2 h-2 md:h-3 md:w-3'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;