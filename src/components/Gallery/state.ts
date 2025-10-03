import { useState, useRef, useMemo } from 'react';
import { useGallery } from '../../hooks/gallery';
import { useTouchHandler } from '../../hooks/useTouch';
import { 
  useMobileDetection, 
  useScreenWidth, 
  useVisibleIndicators, 
  useNavigation, 
  useKeyboardNavigation,
  useTransitions 
} from '../../hooks/useUtils';

export const useGalleryState = () => {
  // Core state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const galleryRef = useRef<HTMLDivElement>(null);

  // Device and interaction hooks
  const isMobile = useMobileDetection();
  const screenWidth = useScreenWidth();
  const { isTransitioning, setIsTransitioning } = useTransitions();
  
  // Gallery data and actions
  const { 
    images, 
    loading, 
    shuffleLoading,
    loadAllImagesWithSmartDetection, 
    randomImage 
  } = useGallery({ currentIndex });

  // Navigation logic
  const { prevImage, nextImage, getAdjacentImages } = useNavigation(
    images, 
    currentIndex, 
    setCurrentIndex, 
    isTransitioning
  );

  // Touch handling
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
  const adjacentImages = useMemo(() => getAdjacentImages(), [getAdjacentImages]);

  // Handlers
  const openGrid = () => setShowGrid(true);
  const openImageModal = () => setShowModal(true);
  const closeImageModal = () => setShowModal(false);

  const handleRandomImage = async () => {
    const newIndex = await randomImage();
    if (newIndex !== undefined) {
      setCurrentIndex(newIndex);
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 100);
    }
  };

  // Keyboard navigation
  useKeyboardNavigation(showGrid, showModal, prevImage, nextImage, closeImageModal);

  return {
    // State
    currentIndex,
    showGrid,
    showModal,
    loading,
    shuffleLoading,
    isTransitioning,
    
    // Data
    images,
    visibleIndicators,
    adjacentImages,
    
    // Device info
    isMobile,
    isDragging,
    
    // Refs
    galleryRef,
    
    // Handlers
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    openGrid,
    openImageModal,
    closeImageModal,
    handleRandomImage,
    loadAllImagesWithSmartDetection,
    prevImage,
    nextImage,
    setCurrentIndex,
    
    // State setters  
    setShowGrid: (show: boolean) => setShowGrid(show)
  };
};