import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getAllImages, type ImageKitImage as Image } from '../services/imageKitService';
import ImageModal from './ImageModal';

interface ImageGridProps {
  images: Image[];
  onClose: () => void;
}

const IMAGES_PER_LOAD = 15; // Load 15 images per batch after initial 30

const ImageGrid: React.FC<ImageGridProps> = ({ images, onClose }) => {
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [visibleImages, setVisibleImages] = useState<Image[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('masonry');
  const [gridDensity, setGridDensity] = useState(3);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const INITIAL_LOAD = 30;
  const IMAGES_PER_LOAD = 15;

  // Load all images once at startup
  useEffect(() => {
    const loadAllImages = async () => {
      try {
        console.log('🔍 Discovering all available images...');
        const allDiscoveredImages = await getAllImages();
        console.log(`✅ Found ${allDiscoveredImages.length} total images`);
        
        setAllImages(allDiscoveredImages);
        setVisibleImages(allDiscoveredImages.slice(0, INITIAL_LOAD));
        setHasMore(allDiscoveredImages.length > INITIAL_LOAD);
      } catch (error) {
        console.error('Error loading images:', error);
        // Fallback to initial images if discovery fails
        setAllImages(images);
        setVisibleImages(images.slice(0, INITIAL_LOAD));
        setHasMore(images.length > INITIAL_LOAD);
      }
    };

    loadAllImages();
  }, [images]);

  // Load more images for infinite scroll
  const fetchMoreData = useCallback(() => {
    if (visibleImages.length >= allImages.length) {
      setHasMore(false);
      return;
    }

    console.log(`📦 Loading more images... (${visibleImages.length}/${allImages.length})`);
    
    // Load next batch with small delay for smooth experience
    setTimeout(() => {
      const nextImages = allImages.slice(
        visibleImages.length, 
        visibleImages.length + IMAGES_PER_LOAD
      );
      
      setVisibleImages(prev => [...prev, ...nextImages]);
      
      // Check if we have more to load
      setHasMore(visibleImages.length + nextImages.length < allImages.length);
    }, 300);
  }, [visibleImages.length, allImages]);

  // Handle slider events
  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSlider(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider || !sliderTrackRef.current) return;
      updateSliderPosition(e.clientX);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDraggingSlider]);

  const updateSliderPosition = (clientX: number) => {
    if (!sliderTrackRef.current) return;
    
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1);
    const newDensity = Math.round(percentage * 4) + 1;
    setGridDensity(newDensity);
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingSlider(true);
    updateSliderPosition(e.clientX);
  };

  // Grid classes based on density
  const getGridClass = () => {
    if (layoutMode === 'masonry') {
      switch (gridDensity) {
        case 1: return 'columns-1 sm:columns-2';
        case 2: return 'columns-2 sm:columns-3';
        case 3: return 'columns-2 sm:columns-3 lg:columns-4';
        case 4: return 'columns-3 sm:columns-4 lg:columns-5';
        case 5: return 'columns-4 sm:columns-5 lg:columns-6';
        default: return 'columns-2 sm:columns-3 lg:columns-4';
      }
    }
    
    switch (gridDensity) {
      case 1: return 'grid-cols-1 sm:grid-cols-2';
      case 2: return 'grid-cols-2 sm:grid-cols-3';
      case 3: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
      case 4: return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5';
      case 5: return 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-6';
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getGapClass = () => {
    switch (gridDensity) {
      case 1: return 'gap-6';
      case 2: return 'gap-5';
      case 3: return 'gap-4';
      case 4: return 'gap-3';
      case 5: return 'gap-2';
      default: return 'gap-4';
    }
  };

  const toggleLayout = () => {
    setLayoutMode(prev => prev === 'grid' ? 'masonry' : 'grid');
  };

  // Modal functions
  const openModal = (image: Image) => setSelectedImage(image);
  const closeModal = () => setSelectedImage(null);
  
  const goToNextImage = () => {
    if (!selectedImage) return;
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % visibleImages.length;
    setSelectedImage(visibleImages[nextIndex]);
  };

  const goToPrevImage = () => {
    if (!selectedImage) return;
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
    setSelectedImage(visibleImages[prevIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sticky top-0 z-10 py-2 px-4 backdrop-blur-md bg-black/10 rounded-full shadow-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block">Back</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Layout Toggle */}
            <button
              onClick={toggleLayout}
              className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              aria-label="Toggle layout mode"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            
            {/* Density Controls */}
            <div className="flex items-center gap-2 bg-white/10 rounded-full backdrop-blur-sm py-2 px-4">
              <button 
                onClick={() => setGridDensity(Math.max(1, gridDensity - 1))}
                disabled={gridDensity <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease density"
              >
                -
              </button>
              
              {/* Slider */}
              <div 
                ref={sliderTrackRef}
                className="w-28 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full relative cursor-pointer"
                onMouseDown={handleSliderClick}
                role="slider"
                aria-valuemin={1}
                aria-valuemax={5}
                aria-valuenow={gridDensity}
              >
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md cursor-pointer"
                  style={{ 
                    left: gridDensity === 5 ? 'calc(100% - 8px)' : `calc(${(gridDensity - 1) * 25}%)`
                  }}
                />
              </div>
              
              <button 
                onClick={() => setGridDensity(Math.min(5, gridDensity + 1))}
                disabled={gridDensity >= 5}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase density"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        {/* Image Grid with Infinite Scroll */}
        <InfiniteScroll
          dataLength={visibleImages.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={<div className="text-center text-white py-4">Loading more images...</div>}
          endMessage={
            <div className="text-center text-gray-400 py-8">
              <p>You've seen all {visibleImages.length} images!</p>
            </div>
          }
        >
          <div 
            className={`${
              layoutMode === 'grid' 
                ? `grid ${getGridClass()} ${getGapClass()}` 
                : `${getGridClass()} gap-4`
            } w-full`}
          >
            {visibleImages.map((image) => (
              <div
                key={image.id}
                className={`${layoutMode === 'masonry' ? 'mb-4 break-inside-avoid' : ''} group relative cursor-pointer`}
                onClick={() => openModal(image)}
              >
                <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className={`${image.ratio === '2:3' ? 'pb-[150%]' : 'pb-[66.67%]'} bg-gray-800 relative`}>
                    <img 
                      className="absolute inset-0 w-full h-full object-cover"
                      src={image.src}
                      alt={image.title}
                      loading="lazy"
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
        </InfiniteScroll>
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
          enableTilt={false}
          prevImage={null}
          nextImage={null}
        />
      )}
    </div>
  );
};

export default ImageGrid;
