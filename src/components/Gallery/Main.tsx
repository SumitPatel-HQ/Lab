import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card } from '../loading-placeholders';
import ImageModal from '../ImageModal';
import Controls from './Controls';
import type { ImageKitImage } from '../../services/ImageKit';

interface MainGalleryViewProps {
  images: ImageKitImage[];
  currentIndex: number;
  isDragging: boolean;
  isMobile: boolean;
  isTransitioning: boolean;
  showModal: boolean;
  adjacentImages: {
    prevImage: ImageKitImage | null;
    nextImage: ImageKitImage | null;
  };
  visibleIndicators: number[];
  loading: boolean;
  galleryRef: React.RefObject<HTMLDivElement | null>;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  openImageModal: () => void;
  closeImageModal: () => void;
  prevImage: () => void;
  nextImage: () => void;
  handleRandomImage: () => void;
  openGrid: () => void;
  loadAllImagesWithSmartDetection: () => void;
  setCurrentIndex: (index: number) => void;
}

export const MainGalleryView: React.FC<MainGalleryViewProps> = ({
  images,
  currentIndex,
  isDragging,
  isMobile,
  isTransitioning,
  showModal,
  adjacentImages,
  visibleIndicators,
  loading,
  galleryRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  openImageModal,
  closeImageModal,
  prevImage,
  nextImage,
  handleRandomImage,
  openGrid,
  loadAllImagesWithSmartDetection,
  setCurrentIndex
}) => (
  <div 
    ref={galleryRef}
    className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 overflow-hidden"
    style={{overscrollBehavior: 'none'}}
  >
    <div 
      className={`w-full h-full relative ${isTransitioning ? 'pointer-events-none' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main image display area */}
      <div className="relative h-full w-full">
        <div 
          className="relative w-full h-full"
          style={{ perspective: '1000px' }}
        >
          {images.map((image, index) => {
            // Only render images that are close to current index for performance
            const diff = Math.abs(index - currentIndex);
            const shouldRender = diff <= 2 || 
                               (currentIndex === 0 && index >= images.length - 2) ||
                               (currentIndex >= images.length - 2 && index <= 2);
            
            if (!shouldRender) return null;
            
            return (
              <div
                key={image.id}
                className="absolute inset-0 cursor-pointer"
                onClick={openImageModal}
              >
                <Card
                  image={image}
                  index={index}
                  activeIndex={currentIndex}
                  totalImages={images.length}
                  isDragging={isDragging}
                  isMobile={isMobile}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Navigation Controls */}
      <Controls
        onPrev={prevImage}
        onNext={nextImage}
        onRandom={handleRandomImage}
        onOpenGrid={openGrid}
        onLoadAll={loadAllImagesWithSmartDetection}
        loading={loading}
        currentIndex={currentIndex}
        visibleIndicators={visibleIndicators}
        onIndicatorClick={setCurrentIndex}
      />
    </div>

    {/* Image Modal */}
    <AnimatePresence>
      {showModal && (
        <ImageModal
          image={images[currentIndex]}
          onClose={closeImageModal}
          onNext={nextImage}
          onPrev={prevImage}
          totalImages={images.length}
          currentIndex={currentIndex}
          enableTilt={!isMobile}
          prevImage={adjacentImages.prevImage}
          nextImage={adjacentImages.nextImage}
        />
      )}
    </AnimatePresence>
  </div>
);