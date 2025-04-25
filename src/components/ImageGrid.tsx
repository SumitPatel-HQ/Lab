import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Grid2X2, Grid3X3, Grid, LayoutGrid, ChevronDown } from 'lucide-react';
import type { Image } from '../services/imageService';

interface ImageGridProps {
  images: Image[];
  onClose: () => void;
}

const IMAGES_PER_LOAD = 50; // Number of images to load in each batch

const ImageGrid: React.FC<ImageGridProps> = ({ images, onClose }) => {
  const [animate, setAnimate] = useState(false);
  const [visibleImages, setVisibleImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('masonry');
  const [gridDensity, setGridDensity] = useState(5); // Default grid density (3 out of 5)
  const [forceUpdate, setForceUpdate] = useState(5); // Add force update state
  
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
  
  const loadMoreImages = () => {
    if (isLoading || visibleImages.length >= images.length) return;
    
    setIsLoading(true);
    
    const nextBatch = images.slice(
      visibleImages.length, 
      visibleImages.length + IMAGES_PER_LOAD
    );
    
    // Use requestAnimationFrame for smoother loading
    requestAnimationFrame(() => {
      setVisibleImages(prev => [...prev, ...nextBatch]);
      setIsLoading(false);
    });
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
      if (newMode === 'grid' && gridDensity < 2) {
        setGridDensity(2);
      }
      
      return newMode;
    });
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setGridDensity(newValue);
    // Force a re-render to apply grid changes immediately
    setForceUpdate(prev => prev + 1);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
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
            
            {/* Replace slider with plus/minus buttons */}
            <div className="flex items-center gap-2 bg-white/10 rounded-full backdrop-blur-sm py-2 px-4">
              <button 
                onClick={decreaseDensity}
                disabled={gridDensity <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease density"
              >
                <span className="text-lg font-semibold">-</span>
              </button>
              
              <div className="w-28 sm:w-36 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full relative">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md cursor-pointer"
                  style={{ left: `calc(${(gridDensity - 1) * 25}%)` }}
                />
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
          key={`${layoutMode}-${gridDensity}-${forceUpdate}`}
          className={`${
            layoutMode === 'grid' 
              ? `grid ${getGridClass()} ${getGridGapClass()}` 
              : getGridClass()
          } w-full`}
        >
          {visibleImages.map((image, index) => (
            <div
              key={image.id}
              className={`${getMasonryItemClass(image)} relative group overflow-hidden rounded-xl shadow-xl transition-all duration-500 ${
                animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${(index % 20) * 30}ms`
              }}
            >
              <div className={`relative ${
                image.ratio === '2:3' ? 'aspect-[2/3]' : 'aspect-[3/2]'
              }`}>
                <img
                  src={image.src}
                  alt={image.title}
                  loading="lazy"
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
        
        {hasMoreImages && (
          <div className="flex justify-center mt-8">
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
              <span>Load More</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGrid;