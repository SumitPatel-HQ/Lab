// local image gallery
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Library } from 'lucide-react';
import ImageCard from './ImageCard';
import ImageGrid from './ImageGrid';
import { getAllImages, type Image as ImageType } from '../services/imageService';

const MAX_VISIBLE_INDICATORS = 8; // Maximum number of indicators to show
const PRELOAD_IMAGES = 3; // Reduced from 5 to 3 to improve performance
const SWIPE_THRESHOLD = 50; // Minimum swipe distance to trigger navigation
const VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger a swipe (pixels/ms)
const SWIPE_RESISTANCE = 0.35; // Resistance factor for more natural swipe feeling

const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<number | null>(null);
  const [visibleImageIndices, setVisibleImageIndices] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [preloadedSrc, setPreloadedSrc] = useState<string | null>(null);
  const prevIndexRef = useRef(currentIndex);
  const touchStartRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const lastTouchXRef = useRef<number | null>(null);
  const velocityRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const imagesLoaded = useRef(false);
  const galleryRef = useRef<HTMLDivElement>(null);

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
      }, 500); // Reduce transition duration for better responsiveness
      
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

  // New swipe handling with smoother animations using requestAnimationFrame
  const onTouchStart = (e: React.TouchEvent) => {
    // Prevent handling touch if we're in a transition
    if (isTransitioning) return;
    
    // Cancel any ongoing animation
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    const touch = e.targetTouches[0].clientX;
    touchStartRef.current = touch;
    lastTouchXRef.current = touch;
    touchStartTimeRef.current = Date.now();
    velocityRef.current = 0;
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const deltaX = currentTouch - touchStartRef.current;
    
    // Track velocity for momentum-based swiping
    if (lastTouchXRef.current !== null) {
      const timeDelta = Date.now() - (touchStartTimeRef.current || Date.now());
      if (timeDelta > 0) {
        const instantVelocity = (currentTouch - lastTouchXRef.current) / timeDelta;
        // Smooth velocity using exponential moving average
        velocityRef.current = velocityRef.current * 0.7 + instantVelocity * 0.3;
      }
    }
    lastTouchXRef.current = currentTouch;
    
    // Apply resistance to make swipe feel more natural
    const resistedDeltaX = deltaX * SWIPE_RESISTANCE;
    
    // Update the drag offset for UI feedback
    setDragOffset(resistedDeltaX);
    
    // Prevent default to stop page scrolling if we're clearly swiping horizontally
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  };

  const animateSwipeReset = () => {
    // Get the starting offset
    const startOffset = dragOffset;
    const startTime = performance.now();
    const duration = 300;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for natural movement (ease-out)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      
      // Calculate new position
      const newOffset = startOffset * (1 - easeOutProgress);
      
      // Update position
      setDragOffset(newOffset);
      
      // Continue animation if not complete
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - reset everything
        setDragOffset(0);
        animationFrameIdRef.current = null;
      }
    };
    
    // Start the animation
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  const animateSwipeCompletion = (direction: 'left' | 'right') => {
    // Get the starting offset
    const startOffset = dragOffset;
    const targetOffset = direction === 'left' ? -window.innerWidth : window.innerWidth;
    const startTime = performance.now();
    const duration = 250;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for natural movement (ease-in)
      const easeInProgress = progress * progress;
      
      // Calculate new position
      const newOffset = startOffset + (targetOffset - startOffset) * easeInProgress;
      
      // Update position
      setDragOffset(newOffset);
      
      // Continue animation if not complete
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setDragOffset(0);
        animationFrameIdRef.current = null;
        
        // Change the image
        if (direction === 'left') {
          nextImage();
        } else {
          prevImage();
        }
      }
    };
    
    // Start the animation
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  const onTouchEnd = () => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) {
      setIsDragging(false);
      return;
    }
    
    const touchEnd = lastTouchXRef.current;
    const deltaX = touchEnd === null || touchStartRef.current === null ? 0 : touchEnd - touchStartRef.current;
    const touchDuration = Date.now() - (touchStartTimeRef.current || Date.now());
    
    // Detect swipe based on distance and velocity
    const velocity = Math.abs(velocityRef.current);
    const isQuickSwipe = velocity > VELOCITY_THRESHOLD;
    const effectiveThreshold = isQuickSwipe ? SWIPE_THRESHOLD * 0.7 : SWIPE_THRESHOLD;
    
    setIsDragging(false);
    
    // Determine if we should complete the swipe or reset
    if (Math.abs(deltaX) >= effectiveThreshold || isQuickSwipe) {
      // Complete the swipe with animation
      animateSwipeCompletion(deltaX < 0 ? 'left' : 'right');
    } else {
      // Not enough movement, animate back to center
      animateSwipeReset();
    }
    
    // Reset touch tracking
    touchStartRef.current = null;
    lastTouchXRef.current = null;
    touchStartTimeRef.current = null;
    velocityRef.current = 0;
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

  if (showGrid) {
    return <ImageGrid images={images} onClose={() => setShowGrid(false)} />;
  }

  // Function to make drag-based navigation more interactive with better performance
  const getTransformStyle = (index: number) => {
    if (!isDragging || dragOffset === 0) return '';
    
    // Only apply drag effect to the active image and adjacent ones
    const diff = index - currentIndex;
    
    // Handle circular navigation (for images at the edges)
    const adjustedDiff = diff === images.length - 1 ? -1 : diff === -(images.length - 1) ? 1 : diff;
    
    if (Math.abs(adjustedDiff) > 1) return '';
    
    if (adjustedDiff === 0) {
      // Main image - move with full offset
      return `translateX(${dragOffset}px) scale(1)`;
    } else if (adjustedDiff === -1 && dragOffset > 0) {
      // Previous image coming in from left
      const progress = Math.min(1, dragOffset / (window.innerWidth * 0.6));
      const scale = 0.9 + progress * 0.1;
      const translateX = -50 + dragOffset;
      return `translateX(${translateX}px) scale(${scale})`;
    } else if (adjustedDiff === 1 && dragOffset < 0) {
      // Next image coming in from right
      const progress = Math.min(1, -dragOffset / (window.innerWidth * 0.6));
      const scale = 0.9 + progress * 0.1;
      const translateX = 50 + dragOffset;
      return `translateX(${translateX}px) scale(${scale})`;
    }
    
    return '';
  };

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
          
          <div className="relative w-full h-[85vh] md:h-[95vh] will-change-transform">
            {visibleImageIndices.map(index => (
              <div 
                key={images[index].id}
                style={{ transform: getTransformStyle(index) }}
                className={`transition-transform ${isTransitioning ? 'duration-500 ease-out' : 'duration-0'}`}
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
            ))}
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