import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, LayoutGrid, ChevronDown } from 'lucide-react';
import type { Image } from '../services/imageService';

interface ImageGridProps {
  images: Image[];
  onClose: () => void;
}

const IMAGES_PER_LOAD = 40; // Number of images to load in each batch

const ImageGrid: React.FC<ImageGridProps> = ({ images, onClose }) => {
  const [animate, setAnimate] = useState(false);
  const [visibleImages, setVisibleImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('masonry');
  const [gridDensity, setGridDensity] = useState(5); // Default grid density (3 out of 5)
  const [forceUpdate, setForceUpdate] = useState(5); // Add force update state
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [newBatchLoaded, setNewBatchLoaded] = useState(false);

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
      if (newMode === 'grid' && gridDensity < 2) {
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
  
  // Specific labels for the slider based on layout mode
  const getDensityLabel = () => {
    return layoutMode === 'masonry' ? 'Columns' : 'Items per row';
  };
  
  const hasMoreImages = visibleImages.length < images.length;

  // Calculate if an image is newly loaded in this batch
  const isNewlyLoaded = (index: number) => {
    return newBatchLoaded && index >= visibleImages.length - IMAGES_PER_LOAD;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-4 sm:p-6 overscroll-none">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sticky top-0 z-10 py-2 backdrop-blur-md bg-gray-900/70">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/10 rounded-full backdrop-blur-sm p-2 px-3">
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
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease density"
              >
                <span className="text-lg font-semibold">-</span>
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-xs text-white/70 mb-1">{getDensityLabel()}</span>
                <div className="w-28 sm:w-36 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full relative">
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md cursor-pointer"
                    style={{ left: `calc(${(gridDensity - 1) * 25}%)` }}
                  />
                </div>
              </div>
              
              <button 
                onClick={increaseDensity}
                disabled={gridDensity >= 5}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase density"
              >
                <span className="text-lg font-semibold">+</span>
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
              className={`${getMasonryItemClass(image)} relative group overflow-hidden rounded-xl shadow-xl transition-all duration-500 ${
                animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } transform-gpu`}
              style={{
                transitionDelay: `${isNewlyLoaded(index) ? Math.min((index % IMAGES_PER_LOAD) * 30, 600) : Math.min((index % 20) * 30, 600)}ms`
              }}
            >
              <div className={`relative ${
                image.ratio === '2:3' ? 'aspect-[2/3]' : 'aspect-[3/2]'
              }`}>
                <img
                  src={image.src}
                  alt={image.title}
                  loading="lazy"
                  decoding="async"
                  width="400"
                  height={image.ratio === '2:3' ? 600 : 266}
                  className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold text-lg">{image.title}</h3>
                    <p className="text-white/80 text-sm">{image.category}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Load more button or indicator */}
        <div 
          ref={loadMoreRef} 
          className="flex justify-center mt-8 pb-4"
        >
          {hasMoreImages ? (
            <button
              onClick={loadMoreImages}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
              <span>Load More Images</span>
            </button>
          ) : visibleImages.length > 0 ? (
            <p className="text-white/70 text-sm">All images loaded</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ImageGrid;