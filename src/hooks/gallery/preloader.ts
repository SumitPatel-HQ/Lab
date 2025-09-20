import { useState, useCallback, useEffect } from 'react';
import { type ImageKitImage, IMAGEKIT_URL_ENDPOINT } from '../../services/ImageKit';
import { GALLERY_CONFIG } from './config';

export interface UseImagePreloaderReturn {
  visibleImageIndices: number[];
  preloadImage: (src: string) => Promise<boolean>;
}

export const useImagePreloader = (
  currentIndex: number,
  images: ImageKitImage[],
  preloadCount: number = GALLERY_CONFIG.PRELOAD_COUNT
): UseImagePreloaderReturn => {
  const [visibleImageIndices, setVisibleImageIndices] = useState<number[]>([]);

  const { PRELOAD_DELAY } = GALLERY_CONFIG;

  // Preload image function
  const preloadImage = useCallback((src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = `${IMAGEKIT_URL_ENDPOINT}${src}`;
    });
  }, []);

  // Calculate visible image indices for preloading
  useEffect(() => {
    if (images.length === 0) return;
    
    const highPriorityIndices = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length
    ];
    
    const secondaryIndices = [];
    for (let i = 2; i <= preloadCount; i++) {
      const prevIndex = (currentIndex - i + images.length) % images.length;
      const nextIndex = (currentIndex + i) % images.length;
      secondaryIndices.push(prevIndex, nextIndex);
    }
    
    setVisibleImageIndices([...highPriorityIndices, ...secondaryIndices]);
  }, [currentIndex, images.length, preloadCount]);

  // Preload visible images
  useEffect(() => {
    if (images.length === 0 || visibleImageIndices.length === 0) return;
    
    const preloadPromises = visibleImageIndices.slice(0, 3).map(index => 
      preloadImage(images[index].src)
    );
    
    Promise.all(preloadPromises).catch(() => {
      // Silently handle preloading errors
    });
  }, [visibleImageIndices, images, preloadImage]);

  // Preload current and adjacent images
  useEffect(() => {
    if (images.length === 0) return;
    
    const currentImageSrc = images[currentIndex].src;
    const preloader = new Image();
    preloader.src = `${IMAGEKIT_URL_ENDPOINT}${currentImageSrc}`;
    
    const preloadAdjacent = () => {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      const nextIndex = (currentIndex + 1) % images.length;
      
      const prevImage = new Image();
      prevImage.src = `${IMAGEKIT_URL_ENDPOINT}${images[prevIndex].src}`;
      
      const nextImage = new Image();
      nextImage.src = `${IMAGEKIT_URL_ENDPOINT}${images[nextIndex].src}`;
    };
    
    const timer = setTimeout(preloadAdjacent, PRELOAD_DELAY);
    return () => clearTimeout(timer);
  }, [currentIndex, images, PRELOAD_DELAY]);

  return {
    visibleImageIndices,
    preloadImage
  };
};