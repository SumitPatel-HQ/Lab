import { useCallback } from 'react';
import { type ImageKitImage } from '../../services/ImageKit';
import { GALLERY_CONFIG } from './config';

export interface ImageRange {
  max: number;
}

export const useImageCache = () => {
  const { CACHE_KEYS, CACHE_EXPIRY_TIME } = GALLERY_CONFIG;

  // Clear all gallery-related cache
  const clearImageCache = useCallback(() => {
    try {
      sessionStorage.removeItem(CACHE_KEYS.IMAGES);
      sessionStorage.removeItem(CACHE_KEYS.TIMESTAMP);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, [CACHE_KEYS.IMAGES, CACHE_KEYS.TIMESTAMP]);

  // Get cached images with age validation
  const getCachedImages = useCallback((): ImageKitImage[] | null => {
    try {
      const cachedImages = sessionStorage.getItem(CACHE_KEYS.IMAGES);
      const cacheTimestamp = sessionStorage.getItem(CACHE_KEYS.TIMESTAMP);
      
      if (!cachedImages || !cacheTimestamp) return null;
      
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      if (cacheAge >= CACHE_EXPIRY_TIME) {
        clearImageCache();
        return null;
      }
      
      return JSON.parse(cachedImages);
    } catch (error) {
      console.warn('Error parsing cached images:', error);
      clearImageCache();
      return null;
    }
  }, [CACHE_KEYS.IMAGES, CACHE_KEYS.TIMESTAMP, CACHE_EXPIRY_TIME, clearImageCache]);

  // Cache images with timestamp
  const cacheImages = useCallback((images: ImageKitImage[]) => {
    try {
      sessionStorage.setItem(CACHE_KEYS.IMAGES, JSON.stringify(images));
      sessionStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.warn('Error caching images:', error);
    }
  }, [CACHE_KEYS.IMAGES, CACHE_KEYS.TIMESTAMP]);

  // Get cached image range
  const getCachedImageRange = useCallback((): ImageRange | null => {
    try {
      const cachedRange = sessionStorage.getItem(CACHE_KEYS.IMAGE_RANGE);
      return cachedRange ? JSON.parse(cachedRange) : null;
    } catch (error) {
      console.warn('Error parsing cached range:', error);
      return null;
    }
  }, [CACHE_KEYS.IMAGE_RANGE]);

  // Cache image range
  const cacheImageRange = useCallback((range: ImageRange) => {
    try {
      sessionStorage.setItem(CACHE_KEYS.IMAGE_RANGE, JSON.stringify(range));
    } catch (error) {
      console.warn('Error caching image range:', error);
    }
  }, [CACHE_KEYS.IMAGE_RANGE]);

  // Clear image range cache
  const clearRangeCache = useCallback(() => {
    try {
      sessionStorage.removeItem(CACHE_KEYS.IMAGE_RANGE);
    } catch (error) {
      console.warn('Error clearing range cache:', error);
    }
  }, [CACHE_KEYS.IMAGE_RANGE]);

  return {
    getCachedImages,
    cacheImages,
    getCachedImageRange,
    cacheImageRange,
    clearImageCache,
    clearRangeCache
  };
};