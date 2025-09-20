import { useState, useEffect, useCallback } from 'react';
import { preloadImageKit as preloadImage } from '../services/ImageKit';
import type { ImageKitImage as Image } from '../services/ImageKit';

export interface ImageLoadingState {
  loaded: boolean;
  error: boolean;
  placeholderLoaded: boolean;
}

export const useImageState = (image: Image | null, prevImage?: Image | null, nextImage?: Image | null) => {
  const [loadingState, setLoadingState] = useState<ImageLoadingState>({
    loaded: false,
    error: false,
    placeholderLoaded: false,
  });

  // Reset loading state when image changes
  useEffect(() => {
    setLoadingState({
      loaded: false,
      error: false,
      placeholderLoaded: false,
    });
  }, [image]);

  // Preload adjacent images
  useEffect(() => {
    if (!image) return;
    
    const preloadAdjacentImages = () => {
      const requestIdleCallbackPolyfill = 
        window.requestIdleCallback || 
        ((callback) => setTimeout(callback, 1));
      
      requestIdleCallbackPolyfill(() => {
        if (nextImage?.src) {
          preloadImage(nextImage.src);
        }
        if (prevImage?.src) {
          preloadImage(prevImage.src);
        }
      });
    };
    
    preloadAdjacentImages();
  }, [image, nextImage, prevImage]);

  const handleImageLoad = useCallback(() => {
    setLoadingState(prev => ({ ...prev, loaded: true }));
  }, []);

  const handleImageError = useCallback(() => {
    setLoadingState(prev => ({ ...prev, error: true }));
  }, []);

  const handlePlaceholderLoad = useCallback(() => {
    setLoadingState(prev => ({ ...prev, placeholderLoaded: true }));
  }, []);

  return {
    loadingState,
    handlers: {
      onImageLoad: handleImageLoad,
      onImageError: handleImageError,
      onPlaceholderLoad: handlePlaceholderLoad,
    },
  };
};