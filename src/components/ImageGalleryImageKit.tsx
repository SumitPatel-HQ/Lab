// ImageKit-powered image gallery
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Library } from 'lucide-react';
import { Image as IKImage } from '@imagekit/react';
import ImageGrid from './ImageGrid';
import ImageModal from './ImageModal';
import { getAllImages, getInitialImages, type ImageKitImage as ImageType, IMAGEKIT_URL_ENDPOINT } from '../services/imageKitService';
import { AnimatePresence } from 'framer-motion';

// Add isMobile detection utility
const isMobileDevice = () => {
  return (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) || 
         (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

// Helper function to optimize image sources for mobile
const getOptimizedImageSrc = (originalSrc: string, isMobile: boolean) => {
  if (!isMobile) return originalSrc;
  
  // ImageKit supports transformations via URL parameters
  // Add quality and width transformations for mobile
  if (originalSrc.includes('?')) {
    return `${originalSrc}&tr=q-70,w-800`;
  } else {
    return `${originalSrc}?tr=q-70,w-800`;
  }
};

// Enhanced configuration for hover effects
const HOVER_CONFIG = {
  MAX_TILT: 10, // Maximum rotation in degrees
  SCALE_FACTOR: 1.05, // How much to scale up on hover
  TRANSITION_SPEED: 0.3, // Transition speed in seconds
  PERSPECTIVE: 1000, // Perspective value for 3D effect
  SHADOW_COLOR: 'rgba(0,0,0,0.2)', // Shadow color
};

const MAX_VISIBLE_INDICATORS = 8; // Maximum number of indicators to show
const PRELOAD_IMAGES = 3; // Preload nearby images
const SWIPE_THRESHOLD = 10; // Minimal finger movement to trigger swipe
const VELOCITY_THRESHOLD = 0.02; // Detect even the slightest flick
const SWIPE_RESISTANCE = 0.2; // Almost no resistance for immediate movement
// Removed unused MAX_ROTATION_ANGLE
const SPRING_ANIMATION_DURATION = 100; // Ultra-fast spring reset
const SWIPE_EXIT_DURATION = 100; // Ultra-fast exit animation
const NEXT_CARD_VISIBILITY_THRESHOLD = 0.1; // Show next card after just 10% of swipe progress

// Custom ImageKit wrapper component that matches the expected ImageCard interface
const ImageKitCard: React.FC<{
  image: ImageType;
  index: number;
  activeIndex: number;
  totalImages: number;
  isDragging?: boolean;
  isMobile?: boolean;
}> = ({ image, index, activeIndex, totalImages, isDragging = false, isMobile = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);

  // Calculate position and rotation based on index relative to active index - ORIGINAL VERSION
  const getCardStyle = () => {
    const diff = index - activeIndex;
    const isActive = diff === 0;
    const isPrev = diff === -1 || (activeIndex === 0 && index === totalImages - 1);
    const isNext = diff === 1 || (activeIndex === totalImages - 1 && index === 0);
    
    // Base styles - ORIGINAL STACK MODEL
    let transform = '';
    let zIndex = 0;
    let opacity = 0;
    
    if (isActive) {
      transform = 'translate(-50%, -50%)';
      zIndex = 30;
      opacity = 1;
    } else if (isPrev) {
      // Original transforms with rotation for better stack effect
      if (isMobile && isDragging) {
        transform = 'translate(-60%, -50%) scale(0.9)'; // Remove rotation during dragging
      } else {
        transform = 'translate(-60%, -50%) rotate(-10deg) scale(0.9)';
      }
      zIndex = 20;
      opacity = 0.7;
    } else if (isNext) {
      // Original transforms with rotation for better stack effect  
      if (isMobile && isDragging) {
        transform = 'translate(-40%, -50%) scale(0.9)'; // Remove rotation during dragging
      } else {
        transform = 'translate(-40%, -50%) rotate(10deg) scale(0.9)';
      }
      zIndex = 20;
      opacity = 0.7;
    } else if (diff < -1 || (activeIndex >= totalImages - 2 && index < activeIndex - 1)) {
      transform = isMobile ? 'translate(-70%, -50%) scale(0.8)' : 'translate(-70%, -50%) rotate(-20deg) scale(0.8)';
      zIndex = 10;
      opacity = 0.5;
    } else if (diff > 1 || (activeIndex <= 1 && index > activeIndex + 1)) {
      transform = isMobile ? 'translate(-30%, -50%) scale(0.8)' : 'translate(-30%, -50%) rotate(20deg) scale(0.8)';
      zIndex = 10;
      opacity = 0.5;
    }
    
    return {
      zIndex,
      opacity,
      transform,
    };
  };

  // Determine aspect ratio class based on the image ratio
  const getAspectRatioClass = () => {
    if (image.ratio === '3:2') {
      return 'aspect-[3/2] max-h-[60vh]'; // Landscape
    }
    return 'aspect-[2/3] max-h-[70vh]'; // Portrait (default)
  };

  const style = getCardStyle();
  
  // Optimize transitions for mobile - ORIGINAL VERSION with mobile optimization
  const getTransitionClass = () => {
    if (isDragging && isMobile) {
      return ""; // No transition during mobile dragging for immediate response
    }
    if (isMobile) {
      return "transition-transform duration-150 ease-linear"; // Very fast and linear for mobile
    }
    return "transition-all duration-300 ease-out"; // Normal for desktop
  };
  
  const handleImageLoad = () => {
    setLoaded(true);
  };

  const handleImageError = () => {
    console.error(`Failed to load image: ${image.src}`);
  };

  return (
    <div 
      className={`absolute top-1/2 left-1/2 w-[80vw] max-w-sm ${getTransitionClass()}`}
      style={{
        zIndex: style.zIndex,
        opacity: style.opacity,
        transform: style.transform,
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {/* Loading placeholder - ORIGINAL VERSION */}
        {!loaded && (
          <div className={`${getAspectRatioClass()} bg-gray-200 animate-pulse flex items-center justify-center`}>
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Low-quality image placeholder - ORIGINAL VERSION */}
        <IKImage
          urlEndpoint={IMAGEKIT_URL_ENDPOINT}
          src={image.src}
          alt=""
          loading="eager"
          className={`absolute inset-0 w-full h-full object-cover blur-sm transition-opacity duration-500 ${placeholderLoaded ? 'opacity-30' : 'opacity-0'}`}
          onLoad={() => setPlaceholderLoaded(true)}
          transformation={[
            {
              quality: 10,
              width: 20,
              blur: 10,
              format: "auto"
            }
          ]}
        />

        {/* Main high-quality image - IMPROVED QUALITY */}
        <IKImage
          urlEndpoint={IMAGEKIT_URL_ENDPOINT}
          src={image.src}
          alt={image.title}
          loading="eager"
          className={`${getAspectRatioClass()} w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          transformation={[
            {
              quality: 95, // Increased from 80 to 95 for better quality
              format: "auto"
            }
          ]}
        />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg drop-shadow-md">{image.title}</h3>
        </div>
      </div>
    </div>
  );
};

const ImageGalleryImageKit: React.FC = () => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  // Remove unused state since we're doing lazy loading now
  const [hideTimeout, setHideTimeout] = useState<number | null>(null);
  const [visibleImageIndices, setVisibleImageIndices] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  // Removed unused swipeDirection state
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
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

  // Add new states for tilt effect
  const [isMobile, setIsMobile] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Load images dynamically from ImageKit with ULTRA-OPTIMIZED approach
  const getImages = useCallback(async () => {
    try {
      setLoading(true);
      // Start with just 5 images for IMMEDIATE loading to prevent lag
      const initialImages = await getInitialImages(5);
      setImages(initialImages);
      imagesLoaded.current = true;
      console.log(`Loaded ${initialImages.length} images for immediate display`);
      
      // Load more images progressively in very small chunks
      setTimeout(async () => {
        try {
          const batch2 = await getAllImages(15);
          if (batch2.length > initialImages.length) {
            setImages(batch2);
            console.log(`Expanded to ${batch2.length} total images`);
          }
        } catch (error) {
          console.warn('Error loading additional images:', error);
        }
      }, 500); // Load more after just 500ms
      
      // Load even more after user has time to interact
      setTimeout(async () => {
        try {
          const batch3 = await getAllImages(35);
          if (batch3.length > 15) {
            setImages(batch3);
            console.log(`Further expanded to ${batch3.length} total images`);
          }
        } catch (error) {
          console.warn('Error loading final batch:', error);
        }
      }, 2000); // Load final batch after 2 seconds
      
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
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

  // Remove unused function since we're doing lazy loading now

  // Modified grid opening to show initial images immediately
  const openGrid = () => {
    setShowGrid(true);
    // No need to load all images at once - ImageGrid will handle lazy loading
  };

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

  // Make transitions almost instant
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100); // Ultra-fast transition (was 200ms)
      
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
      img.src = `${IMAGEKIT_URL_ENDPOINT}${src}`;
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
    
    const preloader = new Image();
    preloader.src = `${IMAGEKIT_URL_ENDPOINT}${currentImageSrc}`;
    
    // Also preload adjacent images in the background
    const preloadAdjacent = () => {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      const nextIndex = (currentIndex + 1) % images.length;
      
      const prevImage = new Image();
      prevImage.src = `${IMAGEKIT_URL_ENDPOINT}${images[prevIndex].src}`;
      
      const nextImage = new Image();
      nextImage.src = `${IMAGEKIT_URL_ENDPOINT}${images[nextIndex].src}`;
    };
    
    // Preload after a small delay
    const timer = setTimeout(preloadAdjacent, 200);
    
    return () => clearTimeout(timer);
  }, [currentIndex, images]);

  const prevImage = useCallback(() => {
    if (isTransitioning) return; // Prevent rapid clicking
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [isTransitioning, images.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
  }, [images.length]);

  // Functions to get adjacent images for preloading
  const getNextImage = (): ImageType | null => {
    const nextIndex = (currentIndex + 1) % images.length;
    return images[nextIndex] || null;
  };
  
  const getPrevImage = (): ImageType | null => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    return images[prevIndex] || null;
  };

  // Improved random image function
  const randomImage = () => {
    // Prevent clicking if already transitioning or loading
    if (isTransitioning || shuffleLoading) return;
    
    // Set loading state to show spinner
    setShuffleLoading(true);
    
    // Find a new random index (avoiding current index if possible)
    let newIndex;
    if (images.length > 1) {
      // For multiple images, ensure we don't get the same image
      const possibleIndices = [...Array(images.length).keys()].filter(i => i !== currentIndex);
      newIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
    } else {
      // Edge case: only one image in gallery
      newIndex = 0;
    }
    
    // Store the new image source for preloading
    const newImageSrc = images[newIndex].src;
    
    // Use requestIdleCallback for preloading when browser is idle (with fallback)
    const preloadWithIdleCallback = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).requestIdleCallback(callback, { timeout: 500 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(callback, 1);
      }
    };
    
    // Create single function for handling state updates
    const updateState = () => {
      // Batch all state updates together
      setIsTransitioning(true);
      setCurrentIndex(newIndex);
      
      // Update preload info
      setVisibleImageIndices([
        newIndex,
        (newIndex + 1) % images.length,
        (newIndex - 1 + images.length) % images.length
      ]);
      
      // Reset loading state after brief delay
      setTimeout(() => {
        setShuffleLoading(false);
      }, 100);
    };
    
    // Start loading image in background, but don't wait for it to complete
    const imgLoader = new Image();
    
    // Move forward with animation after brief timeout or when loaded
    let hasUpdated = false;
    
    const onImageLoaded = () => {
      if (!hasUpdated) {
        hasUpdated = true;
        updateState();
      }
    };
    
    // Set fallback timer to ensure UI updates even if image is slow to load
    setTimeout(() => {
      if (!hasUpdated) {
        hasUpdated = true;
        updateState();
      }
    }, isMobile ? 50 : 100); // Shorter fallback on mobile for better responsiveness
    
    // Set up image loading
    imgLoader.onload = onImageLoaded;
    imgLoader.onerror = onImageLoaded; // Still update even if image fails to load
    
    // Start preloading the image when browser is idle
    preloadWithIdleCallback(() => {
      imgLoader.src = `${IMAGEKIT_URL_ENDPOINT}${newImageSrc}`;
    });
  };

  // Lightning-fast touch handling
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
    setIsDragging(true);
    setDragOffset(0);
    swipeDirectionRef.current = null;
    setSwipeProgress(0);
    swipeDirectionRef.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) return;
    
    // Extract touch data directly
    const touch = e.targetTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    
    // Always prevent default for maximum responsiveness
    e.preventDefault();
    
    // Instant velocity calculation with maximum weight on current movement
    if (lastTouchRef.current !== null) {
      const timeDelta = performance.now() - (touchStartTimeRef.current || performance.now());
      if (timeDelta > 0) {
        const instantVelocityX = (touch.clientX - lastTouchRef.current.x) / timeDelta;
        // 90% weight on current movement for instantaneous response
        velocityXRef.current = velocityXRef.current * 0.1 + instantVelocityX * 0.9;
      }
    }
    
    // Update last position
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Minimal resistance for immediate card movement
    const resistedDeltaX = deltaX * SWIPE_RESISTANCE;
    
    // Set direction immediately
    const direction = deltaX < 0 ? 'left' : 'right';
    if (swipeDirectionRef.current !== direction) {
      swipeDirectionRef.current = direction;
    }
    
    // Require very little movement to reach full swipe progress
    const progress = Math.min(Math.abs(deltaX) / (screenWidthRef.current * 0.1), 1);
    setSwipeProgress(progress);
    
    // Direct DOM-like updates for zero-lag response
    setDragOffset(resistedDeltaX);
    
    // Auto-complete swipe if we pass 70% progress
    if (progress > 0.7 && !isTransitioning) {
      animateSwipeCompletion(direction);
    }
  };

  // Instant swipe completion animation
  const animateSwipeCompletion = (direction: 'left' | 'right') => {
    // Stop any further dragging during the completion
    setIsDragging(false);
    
    const startOffset = dragOffset;
    const targetOffset = direction === 'left' ? -screenWidthRef.current * 0.6 : screenWidthRef.current * 0.6;
    const startTime = performance.now();
    const duration = SWIPE_EXIT_DURATION;
    
    // Precompute next index for faster updates
    const nextIndex = direction === 'left' 
      ? (currentIndex + 1) % images.length 
      : (currentIndex - 1 + images.length) % images.length;
    
    // Ultra-fast animation
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simple linear animation for maximum speed perception
      setSwipeProgress(progress);
      setDragOffset(startOffset + (targetOffset - startOffset) * progress);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Complete immediately
        setDragOffset(0);
        setSwipeProgress(0);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
        
        // Change the image immediately
        setCurrentIndex(nextIndex);
      }
    };
    
    // Start animation immediately
    animationFrameIdRef.current = requestAnimationFrame(animate);
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
        setSwipeProgress(0);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  // Hyper-responsive touch end handler
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
    
    // Consider almost any movement as a swipe
    const velocity = Math.abs(velocityXRef.current);
    const isQuickSwipe = velocity > VELOCITY_THRESHOLD;
    
    // Require almost no movement for a swipe
    const effectiveThreshold = isQuickSwipe ? 1 : SWIPE_THRESHOLD;
    
    setIsDragging(false);
    
    // Complete swipe with almost no threshold
    if (Math.abs(deltaX) >= effectiveThreshold || isQuickSwipe) {
      animateSwipeCompletion(deltaX < 0 ? 'left' : 'right');
    } else {
      animateSpringReset();
    }
    
    // Reset tracking
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
          if (showModal) {
            prevImage();
          } else {
            prevImage();
          }
          break;
        case 'ArrowRight':
          if (showModal) {
            nextImage();
          } else {
            nextImage();
          }
          break;
        case 'Escape':
          if (showModal) {
            closeImageModal();
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGrid, isTransitioning, showModal, nextImage, prevImage]);

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
  }, [currentIndex, images]);

  // Add new function to open modal
  const openImageModal = () => {
    setShowModal(true);
  };

  // Add new function to close modal
  const closeImageModal = () => {
    setShowModal(false);
  };

  // Check if device is mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      
      // Apply additional performance optimizations for mobile devices
      if (mobile && galleryRef.current) {
        // Reduce animation complexity on mobile
        galleryRef.current.style.willChange = 'auto';
        
        // Set a class we can use for mobile-specific styles
        galleryRef.current.classList.add('mobile-gallery');
      }
    };
    
    checkMobile();
    
    // Recheck on resize for responsive behavior
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add mouse position tracking function
  const handleMouseMove = (e: React.MouseEvent, cardId: string) => {
    if (isMobile) return;
    
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Calculate position relative to the center of the image
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    
    setMousePosition({ x, y });
    setHoveredCardId(cardId);
  };

  // Reset position when mouse leaves
  const handleMouseLeave = () => {
    setHoveredCardId(null);
  };

  // Add click outside handler for modal
  const modalRef = useRef<HTMLDivElement>(null);
  
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop (the div with the bg-black/80 class)
    // and not on any of its children
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Discovering available images...</p>
        </div>
      </div>
    );
  }

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
          
          <div 
            className="relative w-full h-[85vh] md:h-[95vh] flex items-center justify-center"
            style={{ perspective: '1000px' }}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="absolute inset-0 cursor-pointer"
                onClick={openImageModal}
                onMouseMove={(e) => handleMouseMove(e, image.id)}
                onMouseLeave={handleMouseLeave}
              >
                <ImageKitCard
                  image={{
                    ...image,
                    src: getOptimizedImageSrc(image.src, isMobile)
                  }}
                  index={index}
                  activeIndex={currentIndex}
                  totalImages={images.length}
                  isDragging={isDragging}
                  isMobile={isMobile}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Fixed bottom navigation bar */}
        <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-40">
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
              onClick={openGrid}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 hover:scale-105 shadow-lg"
              aria-label="View library"
            >
              <Library className="w-5 h-5" />
              <span className="font-medium">Library</span>
            </button>
          </div>
          
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

      {/* Image Modal */}
      <AnimatePresence>
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={handleModalBackdropClick}
          >
            <div ref={modalRef}>
              <ImageModal
                image={images[currentIndex]}
                onClose={closeImageModal}
                onNext={nextImage}
                onPrev={prevImage}
                totalImages={images.length}
                currentIndex={currentIndex}
                enableTilt={!isMobile}
                prevImage={getPrevImage()}
                nextImage={getNextImage()}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGalleryImageKit;
