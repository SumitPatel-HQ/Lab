import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, LayoutGrid, ChevronDown } from 'lucide-react';
import type { Image } from '../services/imageService';
import ImageModal from './ImageModal';

// Add isMobile detection utility
const isMobileDevice = () => {
  return (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) || 
         (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

// Enhanced configuration for hover effects
const HOVER_CONFIG = {
  MAX_TILT: 10, // Maximum rotation in degrees
  SCALE_FACTOR: 1.7, // How much to scale up on hover
  TRANSITION_SPEED: 0.7, // Transition speed in seconds
  PERSPECTIVE: 1000, // Perspective value for 3D effect
  SHADOW_COLOR: 'rgba(0,0,0,0.2)', // Shadow color
};

interface ImageGridProps {
  images: Image[];
  onClose: () => void;
}

// Add tilt interface for tracking tilt state per image
interface TiltState {
  id: string;
  rotateX: number;
  rotateY: number;
  isHovering: boolean;
}

const IMAGES_PER_LOAD = 40; // Number of images to load in each batch

const ImageGrid: React.FC<ImageGridProps> = ({ images, onClose }) => {
  const [animate, setAnimate] = useState(false);
  const [visibleImages, setVisibleImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('masonry');
  const [gridDensity, setGridDensity] = useState(5); // Default grid density (3 out of 5)
  const [forceUpdate, setForceUpdate] = useState(5); // Add force update state
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const [newBatchLoaded, setNewBatchLoaded] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElements = useRef<Map<string, HTMLDivElement>>(new Map());

  // Add new states for tilt effect
  const [isMobile, setIsMobile] = useState(false);
  const [tiltStates, setTiltStates] = useState<Record<string, TiltState>>({});
  
  // Check if device is mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);
  
  // Setup smooth scroll behavior when component mounts
  useEffect(() => {
    // Set smooth scrolling for the entire document
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Cleanup function to reset when component unmounts
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
  
  useEffect(() => {
    setAnimate(true);
  }, []);
  
  // Apply adjustments when layout mode changes
  useEffect(() => {
    // Ensure grid density is appropriate for the layout mode
    if (layoutMode === 'grid' && gridDensity < 2) {
      setGridDensity(2); // Minimum 2 for grid layout
    }
  }, [layoutMode, gridDensity]);
  
  // Initialize with first batch of images
  useEffect(() => {
    setVisibleImages(images.slice(0, IMAGES_PER_LOAD));
  }, [images]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create a new IntersectionObserver
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Get the image element
          const image = entry.target.querySelector('img');
          if (image && image.dataset.src) {
            // Load the actual image
            image.src = image.dataset.src;
            // Stop observing this element
            observerRef.current?.unobserve(entry.target);
          }
        }
      });
    }, { 
      rootMargin: '200px', // Start loading when image is within 200px
      threshold: 0.1 // 10% visibility
    });

    // Observe all of our image containers
    observedElements.current.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [visibleImages]);
  
  // Define loadMoreImages before it's used in the useEffect hook
  const loadMoreImages = useCallback(() => {
    if (isLoading || visibleImages.length >= images.length) return;
    
    setIsLoading(true);
    setNewBatchLoaded(true);
    
    // Load exactly 40 more images when button is clicked
    requestAnimationFrame(() => {
      const nextBatch = images.slice(
        visibleImages.length, 
        visibleImages.length + IMAGES_PER_LOAD
      );
      
      // Small delay to prepare for animation
      setTimeout(() => {
        setVisibleImages(prev => [...prev, ...nextBatch]);
        setIsLoading(false);
        
        // Reset the new batch loaded flag after animation completes
        setTimeout(() => {
          setNewBatchLoaded(false);
        }, 1000);
      }, 50);
    });
  }, [isLoading, visibleImages.length, images]);
  
  // Setup intersection observer to detect when load more button is in view
  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      // Only scroll the button into view, but don't automatically load more images
      // The actual loading happens when the user clicks the button
    }, { rootMargin: '200px' }); // Show button before reaching bottom
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, []);
  
  // Handle slider touch events
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDraggingSlider(false);
    };

    const handleTouchEnd = () => {
      setIsDraggingSlider(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider || !sliderTrackRef.current) return;
      
      updateSliderPosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingSlider || !sliderTrackRef.current) return;
      
      updateSliderPosition(e.touches[0].clientX);
      e.preventDefault(); // Prevent scrolling while dragging
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDraggingSlider]);

  const updateSliderPosition = (clientX: number) => {
    if (!sliderTrackRef.current) return;
    
    const track = sliderTrackRef.current;
    const rect = track.getBoundingClientRect();
    const trackWidth = rect.width;
    const offsetX = clientX - rect.left;

    // Calculate position percentage (0 to 1)
    let percentage = Math.min(Math.max(0, offsetX / trackWidth), 1);
    
    // Convert to grid density (1 to 5)
    const newDensity = Math.round(percentage * 4) + 1;
    setGridDensity(newDensity);
  };

  const handleSliderTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingSlider(true);
    updateSliderPosition(e.clientX);
  };

  const handleSliderTrackTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDraggingSlider(true);
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleSliderThumbMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  const handleSliderThumbTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };
  
  const getGridClass = () => {
    if (layoutMode === 'masonry') {
      // For masonry, use explicit column classes based on density
      switch (Math.round(gridDensity)) {
        case 1: return 'columns-1 sm:columns-2 lg:columns-3';
        case 2: return 'columns-2 sm:columns-3 lg:columns-4';
        case 3: return 'columns-3 sm:columns-4 lg:columns-5';
        case 4: return 'columns-4 sm:columns-5 lg:columns-6';
        case 5: return 'columns-5 sm:columns-6 lg:columns-7';
        default: return 'columns-3 sm:columns-4 lg:columns-5';
      }
    }
    
    // For regular grid, use explicit grid-cols classes
    switch (Math.round(gridDensity)) {
      case 1: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2';
      case 2: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 3: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
      case 4: return 'grid-cols-1 sm:grid-cols-3 md:grid-cols-5';
      case 5: return 'grid-cols-1 sm:grid-cols-3 md:grid-cols-6';
      default: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
    }
  };
  
  const getGridGapClass = () => {
    // Explicit gap classes based on density
    switch (Math.round(gridDensity)) {
      case 1: return 'gap-6';
      case 2: return 'gap-5';
      case 3: return 'gap-4';
      case 4: return 'gap-3';
      case 5: return 'gap-2';
      default: return 'gap-4';
    }
  };
  
  const getMasonryItemClass = (image: Image) => {
    if (layoutMode !== 'masonry') return '';
    
    // Adjust the break behavior based on image ratio
    if (image.ratio === '2:3') {
      return 'mb-4 sm:mb-5 break-inside-avoid';
    } else {
      return 'mb-4 sm:mb-5 break-inside-avoid';
    }
  };

  const toggleLayout = () => {
    setLayoutMode(prev => {
      const newMode = prev === 'grid' ? 'masonry' : 'grid';
      
      // Adjust density based on layout mode
      if (newMode === 'grid' && gridDensity <2 ) {
        setGridDensity(2);
      }
      
      return newMode;
    });
  };
  
  // Add direct controls for density
  const decreaseDensity = () => {
    if (gridDensity > 1) {
      const newValue = gridDensity - 1;
      setGridDensity(newValue);
      setForceUpdate(prev => prev + 1);
    }
  };
  
  const increaseDensity = () => {
    if (gridDensity < 5) {
      const newValue = gridDensity + 1;
      setGridDensity(newValue);
      setForceUpdate(prev => prev + 1);
    }
  };
  
  // This function is now unused since we're removing the titles
  const getDensityLabel = () => {
    return layoutMode === 'masonry' ? 'Columns' : 'Items per row';
  };
  
  const hasMoreImages = visibleImages.length < images.length;

  // Calculate if an image is newly loaded in this batch
  const isNewlyLoaded = (index: number) => {
    return newBatchLoaded && index >= visibleImages.length - IMAGES_PER_LOAD;
  };

  // Add modal functionality
  const openModal = (image: Image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Navigation functions for the modal
  const goToNextImage = useCallback(() => {
    if (!selectedImage) return;
    
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % visibleImages.length;
    setSelectedImage(visibleImages[nextIndex]);
  }, [selectedImage, visibleImages]);

  const goToPrevImage = useCallback(() => {
    if (!selectedImage) return;
    
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) return;
    
    const prevIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
    setSelectedImage(visibleImages[prevIndex]);
  }, [selectedImage, visibleImages]);

  // Handle reference for lazy loading
  const setImageRef = useCallback((element: HTMLDivElement | null, id: string) => {
    if (element) {
      observedElements.current.set(id, element);
      observerRef.current?.observe(element);
    } else {
      observedElements.current.delete(id);
    }
  }, []);

  // Add touch swipe detection for the modal
  const handleSwipeGesture = (direction: 'left' | 'right') => {
    if (!selectedImage) return;
    
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) return;
    
    if (direction === 'left') {
      // Next image
      const nextIndex = (currentIndex + 1) % visibleImages.length;
      setSelectedImage(visibleImages[nextIndex]);
    } else {
      // Previous image
      const prevIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
      setSelectedImage(visibleImages[prevIndex]);
    }
  };

  // Add tilt effect handlers
  const handleMouseMove = (e: React.MouseEvent, imageId: string) => {
    if (isMobile) return;
    
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Calculate position relative to the center of the image
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    
    const MAX_TILT = HOVER_CONFIG.MAX_TILT;
    
    setTiltStates(prev => ({
      ...prev,
      [imageId]: {
        id: imageId,
        rotateX: -y * MAX_TILT,
        rotateY: x * MAX_TILT,
        isHovering: true
      }
    }));
  };
  
  const handleMouseEnter = (imageId: string) => {
    if (isMobile) return;
    
    setTiltStates(prev => ({
      ...prev,
      [imageId]: {
        id: imageId,
        rotateX: 0,
        rotateY: 0,
        isHovering: true
      }
    }));
  };
  
  const handleMouseLeave = (imageId: string) => {
    if (isMobile) return;
    
    setTiltStates(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        isHovering: false,
        rotateX: 0,
        rotateY: 0
      }
    }));
  };
  
  // Get tilt style for an image
  const getTiltStyle = (imageId: string): React.CSSProperties => {
    const tiltState = tiltStates[imageId];
    
    if (!tiltState || !tiltState.isHovering || isMobile) {
      return {
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: `transform ${HOVER_CONFIG.TRANSITION_SPEED}s ease-out, box-shadow ${HOVER_CONFIG.TRANSITION_SPEED}s ease-out`,
        boxShadow: '0 10px 20px -10px rgba(0,0,0,0)'
      };
    }
    
    return {
      transform: `perspective(${HOVER_CONFIG.PERSPECTIVE}px) rotateX(${tiltState.rotateX}deg) rotateY(${tiltState.rotateY}deg) scale(${HOVER_CONFIG.SCALE_FACTOR})`,
      transition: 'transform 0.05s linear',
      willChange: 'transform',
      zIndex: 10,
      boxShadow: `0 20px 30px -10px ${HOVER_CONFIG.SHADOW_COLOR}`
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-4 sm:p-6 overscroll-none">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sticky top-0 z-10 py-2 px-4 backdrop-blur-md bg-indigo-1/10 rounded-full shadow-2xl">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:block">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/10 rounded-full backdrop-blur-sm p-2 px-2">
              <button
                onClick={toggleLayout}
                className="p-2 rounded-full bg-indigo-600 text-white"
                aria-label="Toggle layout mode"
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="sr-only">Toggle Layout</span>
              </button>
            </div>
            
            {/* Density controls */}
            <div className="flex items-center gap-2 bg-white/10 rounded-full backdrop-blur-sm py-2 px-4">
              <button 
                onClick={decreaseDensity}
                disabled={gridDensity <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:bg-white/30"
                aria-label="Decrease density"
              >
                <span className="text-lg leading-none flex items-center justify-center h-5">-</span>
              </button>
              
              <div>
                <div 
                  ref={sliderTrackRef}
                  className="w-28 sm:w-36 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full relative cursor-pointer"
                  onMouseDown={handleSliderTrackMouseDown}
                  onTouchStart={handleSliderTrackTouchStart}
                  role="slider"
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-valuenow={gridDensity}
                  aria-label={layoutMode === 'masonry' ? 'Adjust column count' : 'Adjust items per row'}
                  tabIndex={0}
                >
                  <div 
                    ref={sliderRef}
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md cursor-pointer transition-all touch-action-none"
                    style={{ 
                      left: gridDensity === 5 
                        ? 'calc(100% - 15px)' 
                        : `calc(${(gridDensity - 1) * 25}%)`
                    }}
                    onMouseDown={handleSliderThumbMouseDown}
                    onTouchStart={handleSliderThumbTouchStart}
                  />
                </div>
              </div>
              
              <button 
                onClick={increaseDensity}
                disabled={gridDensity >= 5}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:bg-white/30"
                aria-label="Increase density"
              >
                <span className="text-lg leading-none flex items-center justify-center h-5">+</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Use key to force re-render when layout or density changes */}
        <div 
          ref={gridContainerRef}
          key={`${layoutMode}-${gridDensity}-${forceUpdate}`}
          className={`${
            layoutMode === 'grid' 
              ? `grid ${getGridClass()} ${getGridGapClass()}` 
              : getGridClass()
          } w-full will-change-transform`}
        >
          {visibleImages.map((image, index) => (
            <div
              key={image.id}
              ref={(el) => setImageRef(el, image.id)}
              className={`${getMasonryItemClass(image)} ${
                isNewlyLoaded(index) 
                  ? 'animate-card-appear opacity-0' 
                  : ''
              } group relative`}
              style={{
                animationDelay: `${Math.min(index % IMAGES_PER_LOAD * 50, 1000)}ms`,
              }}
              onClick={() => openModal(image)}
              onMouseMove={(e) => handleMouseMove(e, image.id)}
              onMouseEnter={() => handleMouseEnter(image.id)}
              onMouseLeave={() => handleMouseLeave(image.id)}
            >
              <div 
                className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-xl duration-300"
                style={getTiltStyle(image.id)}
              >
                <div className={`${image.ratio === '2:3' ? 'pb-[150%]' : 'pb-[66.67%]'} bg-gray-800 relative`}>
                  <img 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 hover:opacity-100"
                    data-src={image.src}
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" // Tiny placeholder
                    alt={image.title}
                    loading="lazy"
                    onLoad={(e) => {
                      // When image is loaded from data-src, fade it in
                      if ((e.target as HTMLImageElement).src !== "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E") {
                        (e.target as HTMLImageElement).classList.replace('opacity-0', 'opacity-100');
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white text-sm font-medium">{image.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {hasMoreImages && (
          <div 
            ref={loadMoreRef}
            className="flex justify-center mt-8 mb-4"
          >
            <button
              onClick={loadMoreImages}
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white font-medium shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:scale-100 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Load More</span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={closeModal}
          onNext={goToNextImage}
          onPrev={goToPrevImage}
          totalImages={visibleImages.length}
          currentIndex={visibleImages.findIndex(img => img.id === selectedImage.id)}
          enableTilt={!isMobile} // Pass tilt enablement to modal
        />
      )}
    </div>
  );
};

export default ImageGrid;