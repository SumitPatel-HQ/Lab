// Optimized image preloader for faster gallery loading
import { useState, useEffect, useCallback } from 'react';
import { createImageTransformations, getOptimizedImageUrl } from '../services/ImageKit/config';
import type { ImageKitImage } from '../services/ImageKit';

interface UseOptimizedPreloaderOptions {
  images: ImageKitImage[];
  currentIndex: number;
  preloadRadius?: number;
  quality?: 'thumbnail' | 'preview' | 'full';
}

interface PreloadedImage {
  id: string;
  loaded: boolean;
  error: boolean;
}

export const useOptimizedPreloader = ({
  images,
  currentIndex,
  preloadRadius = 3,
  quality = 'preview'
}: UseOptimizedPreloaderOptions) => {
  const [preloadedImages, setPreloadedImages] = useState<Map<string, PreloadedImage>>(new Map());

  const preloadImage = useCallback((image: ImageKitImage, imageQuality: string) => {
    return new Promise<void>((resolve) => {
      if (preloadedImages.get(image.id)?.loaded) {
        resolve();
        return;
      }

      const img = new Image();
      const imagePath = image.src.split('?')[0].replace(import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '', '');
      
      img.onload = () => {
        setPreloadedImages(prev => new Map(prev).set(image.id, { id: image.id, loaded: true, error: false }));
        resolve();
      };

      img.onerror = () => {
        setPreloadedImages(prev => new Map(prev).set(image.id, { id: image.id, loaded: false, error: true }));
        resolve();
      };

      img.src = getOptimizedImageUrl(imagePath, imageQuality);
    });
  }, [preloadedImages]);

  const preloadImagesInRange = useCallback(async (startIndex: number, endIndex: number) => {
    const imagesToPreload = images.slice(startIndex, endIndex + 1);
    const transformationString = (() => {
      switch (quality) {
        case 'thumbnail':
          return createImageTransformations.thumbnail(400);
        case 'preview':
          return createImageTransformations.preview(800);
        case 'full':
          return createImageTransformations.fullSize(1200);
        default:
          return createImageTransformations.preview(800);
      }
    })();

    // Preload images in small batches to avoid overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < imagesToPreload.length; i += batchSize) {
      const batch = imagesToPreload.slice(i, i + batchSize);
      await Promise.all(batch.map(image => preloadImage(image, transformationString)));
      
      // Small delay between batches to maintain UI responsiveness
      if (i + batchSize < imagesToPreload.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }, [images, quality, preloadImage]);

  // Preload images around current index
  useEffect(() => {
    if (images.length === 0) return;

    const startIndex = Math.max(0, currentIndex - preloadRadius);
    const endIndex = Math.min(images.length - 1, currentIndex + preloadRadius);

    preloadImagesInRange(startIndex, endIndex);
  }, [currentIndex, images.length, preloadRadius, preloadImagesInRange]);

  const isImagePreloaded = useCallback((imageId: string): boolean => {
    return preloadedImages.get(imageId)?.loaded || false;
  }, [preloadedImages]);

  const getPreloadProgress = useCallback((): number => {
    if (images.length === 0) return 100;
    
    const startIndex = Math.max(0, currentIndex - preloadRadius);
    const endIndex = Math.min(images.length - 1, currentIndex + preloadRadius);
    const totalImages = endIndex - startIndex + 1;
    
    let loadedCount = 0;
    for (let i = startIndex; i <= endIndex; i++) {
      if (isImagePreloaded(images[i]?.id)) {
        loadedCount++;
      }
    }
    
    return (loadedCount / totalImages) * 100;
  }, [images, currentIndex, preloadRadius, isImagePreloaded]);

  return {
    isImagePreloaded,
    preloadProgress: getPreloadProgress(),
    preloadedImagesCount: preloadedImages.size,
  };
};