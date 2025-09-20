import { useState, useEffect, useCallback, useMemo } from 'react';
import { type ImageKitImage as ImageType } from '../services/ImageKit';

// Mobile detection utility
export const isMobileDevice = () => {
  return (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) || 
         (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

// Mobile detection hook
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());

  useEffect(() => {
    const checkMobile = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Screen width tracking hook
export const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenWidth;
};

// Image optimization utility
export const getOptimizedImageSrc = (originalSrc: string, isMobile: boolean) => {
  if (!isMobile) return originalSrc;
  
  if (originalSrc.includes('?')) {
    return `${originalSrc}&tr=q-70,w-800`;
  } else {
    return `${originalSrc}?tr=q-70,w-800`;
  }
};

// Visible indicators calculation hook
export const useVisibleIndicators = (currentIndex: number, totalImages: number, maxVisible = 8) => {
  return useMemo(() => {
    if (totalImages <= maxVisible) {
      return Array.from({ length: totalImages }, (_, i) => i);
    }

    const halfCount = Math.floor(maxVisible / 2);
    let startIndex = currentIndex - halfCount;
    let endIndex = currentIndex + halfCount;

    if (startIndex < 0) {
      endIndex -= startIndex;
      startIndex = 0;
    }

    if (endIndex >= totalImages) {
      startIndex = Math.max(0, startIndex - (endIndex - totalImages + 1));
      endIndex = totalImages - 1;
    }

    if (endIndex - startIndex + 1 > maxVisible) {
      endIndex = startIndex + maxVisible - 1;
    }

    return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i);
  }, [currentIndex, totalImages, maxVisible]);
};

// Navigation handlers hook
export const useNavigation = (
  images: ImageType[], 
  currentIndex: number, 
  setCurrentIndex: (index: number) => void,
  isTransitioning: boolean
) => {
  const prevImage = useCallback(() => {
    if (isTransitioning || images.length === 0) return;
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [isTransitioning, images.length, currentIndex, setCurrentIndex]);

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((currentIndex + 1) % images.length);
  }, [images.length, currentIndex, setCurrentIndex]);

  const getAdjacentImages = useCallback(() => {
    if (images.length === 0) return { prevImage: null, nextImage: null };
    
    const nextIndex = (currentIndex + 1) % images.length;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    
    return {
      nextImage: images[nextIndex] || null,
      prevImage: images[prevIndex] || null
    };
  }, [images, currentIndex]);

  return {
    prevImage,
    nextImage,
    getAdjacentImages
  };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  showGrid: boolean,
  showModal: boolean,
  onPrev: () => void,
  onNext: () => void,
  onCloseModal: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGrid) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'Escape':
          if (showModal) {
            onCloseModal();
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGrid, showModal, onPrev, onNext, onCloseModal]);
};

// Transition state management hook
export const useTransitions = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<number | null>(null);

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

  return {
    isTransitioning,
    setIsTransitioning,
    hideTimeout
  };
};
