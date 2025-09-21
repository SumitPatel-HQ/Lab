import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { ImageKitImage as Image } from '../../services/ImageKit';
import ImageModal from '../ImageModal';
import ScrollToTop from '../ScrollToTop';
import { GridSkeleton } from '../loading-placeholders';
import Header from './Header';
import ImageCard from './ImageCard';
import { useImageGrid } from './useImageGrid';
import { useModal } from './useModal';
import { useSliderControl } from './slider';
import { getGridClass, getGapClass } from './utils';

interface ImageGridProps {
  images: Image[];
  onClose: () => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onClose }) => {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('masonry');
  const [gridDensity, setGridDensity] = useState(3);

  // Custom hooks
  const { visibleImages, hasMore, isInitialLoading, fetchMoreData } = useImageGrid(images);
  const { selectedImage, openModal, closeModal, goToNextImage, goToPrevImage } = useModal();
  const { handleSliderStart } = useSliderControl();

  // Handler functions
  const handleToggleLayout = () => {
    setLayoutMode(prev => prev === 'grid' ? 'masonry' : 'grid');
  };

  const handleGridDensityChange = (density: number) => {
    setGridDensity(density);
  };

  const handleGoToNext = () => goToNextImage(visibleImages);
  const handleGoToPrev = () => goToPrevImage(visibleImages);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 " style={{overscrollBehavior: 'none'}}>
      <div className="max-w-7xl mx-auto relative">
        <Header
          onClose={onClose}
          onToggleLayout={handleToggleLayout}
          gridDensity={gridDensity}
          onGridDensityChange={handleGridDensityChange}
          onSliderStart={handleSliderStart}
        />
        
        <div className="p-4 sm:p-6 pt-0">
          {/* Show skeleton loading during initial discovery */}
        {isInitialLoading ? (
          <GridSkeleton 
            layoutMode={layoutMode}
            gridDensity={gridDensity}
            count={30}
          />
        ) : (
          <InfiniteScroll
            dataLength={visibleImages.length}
            next={fetchMoreData}
            hasMore={hasMore}
            loader={
              <div className="py-8">
                <GridSkeleton 
                  layoutMode={layoutMode}
                  gridDensity={gridDensity}
                  count={6}
                />
              </div>
            }
            
          >
            <div 
              className={`${
                layoutMode === 'grid' 
                  ? `grid ${getGridClass(layoutMode, gridDensity)} ${getGapClass(gridDensity)}` 
                  : `${getGridClass(layoutMode, gridDensity)} gap-4`
              } w-full`}
            >
              {visibleImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  layoutMode={layoutMode}
                  onImageClick={openModal}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}
        </div>
      </div>

      <ScrollToTop />

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={closeModal}
          onNext={handleGoToNext}
          onPrev={handleGoToPrev}
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