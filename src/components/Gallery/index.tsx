// Optimized ImageKit-powered image gallery
import React, { useState, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import ImageGrid from '../ImageGrid';
import ImageModal from '../ImageModal';
import Card from './Card';
import Controls from './Controls';
import { useGallery } from '../../hooks/useGallery';
import { useTouchHandler } from '../../hooks/useTouch';
import { 
  useMobileDetection, 
  useScreenWidth, 
  getOptimizedImageSrc, 
  useVisibleIndicators, 
  useNavigation, 
  useKeyboardNavigation,
  useTransitions 
} from '../../hooks/useUtils';

const Gallery: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Custom hooks for functionality
  const isMobile = useMobileDetection();
  const screenWidth = useScreenWidth();
  const { isTransitioning, setIsTransitioning } = useTransitions();
  
  const { 
    images, 
    loading, 
    shuffleLoading, 
    loadAllImagesWithSmartDetection, 
    randomImage 
  } = useGallery({ currentIndex });

  const { prevImage, nextImage, getAdjacentImages } = useNavigation(
    images, 
    currentIndex, 
    setCurrentIndex, 
    isTransitioning
  );

  const { 
    isDragging,
    onTouchStart, 
    onTouchMove, 
    onTouchEnd 
  } = useTouchHandler({
    onNext: nextImage,
    onPrev: prevImage,
    isTransitioning,
    screenWidth
  });

  const visibleIndicators = useVisibleIndicators(currentIndex, images.length, 8);

  // Memoize adjacent images calculation to prevent unnecessary re-renders
  const adjacentImages = useMemo(() => getAdjacentImages(), [getAdjacentImages]);

  // Navigation handlers
  const openGrid = () => setShowGrid(true);
  const openImageModal = () => setShowModal(true);
  const closeImageModal = () => setShowModal(false);

  const handleRandomImage = () => {
    const newIndex = randomImage();
    if (newIndex !== undefined) {
      setCurrentIndex(newIndex);
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 100);
    }
  };

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  };

  // Keyboard navigation
  useKeyboardNavigation(showGrid, showModal, prevImage, nextImage, closeImageModal);

  // Loading state
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

  // Grid view
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
        {/* Main image display area */}
        <div className="relative h-full w-full flex items-center justify-center">
          <div 
            className="relative w-full h-[85vh] md:h-[95vh] flex items-center justify-center"
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
          shuffleLoading={shuffleLoading}
          loading={loading}
          currentIndex={currentIndex}
          visibleIndicators={visibleIndicators}
          onIndicatorClick={setCurrentIndex}
        />
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
                prevImage={adjacentImages.prevImage}
                nextImage={adjacentImages.nextImage}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
