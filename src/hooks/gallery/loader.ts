import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  getAllImages, 
  getAllImagesWithRangeDetection, 
  getEstimatedImageCount, 
  getInitialImages, 
  type ImageKitImage 
} from '../../services/ImageKit';
import { useImageCache } from './cache';
import { GALLERY_CONFIG } from './config';

export interface UseImageLoaderReturn {
  images: ImageKitImage[];
  loading: boolean;
  totalAvailableImages: number;
  loadImages: () => Promise<(() => void) | undefined>;
  loadAllImagesWithSmartDetection: () => Promise<void>;
  setTotalAvailableImages: (count: number) => void;
  initializeTotalFromCache: () => void;
}

export const useImageLoader = (): UseImageLoaderReturn => {
  const [images, setImages] = useState<ImageKitImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAvailableImages, setTotalAvailableImages] = useState<number>(0);
  
  const imagesLoaded = useRef(false);
  const { getCachedImages, cacheImages, getCachedImageRange } = useImageCache();

  // Initialize images from cache immediately to prevent loading flash
  useEffect(() => {
    const cachedImages = getCachedImages();
    if (cachedImages && cachedImages.length > 0) {
      setImages(cachedImages);
      setLoading(false);
      imagesLoaded.current = true;
      console.log(`🚀 Early cache restore: ${cachedImages.length} images`);
    }
  }, [getCachedImages]);

  const {
    INITIAL_BATCH_SIZE,
    SECOND_BATCH_SIZE,
    FINAL_BATCH_SIZE,
    SECOND_BATCH_DELAY,
    FINAL_BATCH_DELAY
  } = GALLERY_CONFIG;

  // Load images with progressive batching
  const loadImages = useCallback(async () => {
    try {
      // If images are already loaded from cache, don't reload
      if (imagesLoaded.current && images.length > 0) {
        console.log('✅ Images already loaded from cache, skipping...');
        return;
      }
      
      setLoading(true);
      
      // Check cache again (in case useEffect didn't run yet)
      const cachedImages = getCachedImages();
      console.log('🔍 Cache check result:', {
        hasCache: !!cachedImages,
        cacheLength: cachedImages?.length || 0,
        cacheFirstImage: cachedImages?.[0]?.src || 'none'
      });
      
      if (cachedImages && cachedImages.length > 0) {
        console.log(`🚀 Restored ${cachedImages.length} images from cache - no lag!`);
        setImages(cachedImages);
        imagesLoaded.current = true;
        setLoading(false);
        return;
      }

      console.log('❌ No cache found, loading fresh images...');

      // Start with initial batch for immediate loading
      const initialImages = await getInitialImages(INITIAL_BATCH_SIZE);
      setImages(initialImages);
      imagesLoaded.current = true;
      console.log(`Loaded ${initialImages.length} images for immediate display`);
      
      // Cache initial images immediately
      cacheImages(initialImages);
      
      // Load more images progressively with cleanup tracking
      const timeoutIds: number[] = [];
      
      const timeout1 = window.setTimeout(async () => {
        try {
          const batch2 = await getAllImages(SECOND_BATCH_SIZE);
          if (batch2.length > initialImages.length) {
            setImages(batch2);
            console.log(`Expanded to ${batch2.length} total images`);
            cacheImages(batch2);
          }
        } catch (error) {
          console.warn('Error loading additional images:', error);
        }
      }, SECOND_BATCH_DELAY);
      timeoutIds.push(timeout1);
      
      // Load final batch
      const timeout2 = window.setTimeout(async () => {
        try {
          const batch3 = await getAllImages(FINAL_BATCH_SIZE);
          if (batch3.length > SECOND_BATCH_SIZE) {
            setImages(batch3);
            console.log(`Further expanded to ${batch3.length} total images`);
            cacheImages(batch3);
          }
        } catch (error) {
          console.warn('Error loading final batch:', error);
        }
      }, FINAL_BATCH_DELAY);
      timeoutIds.push(timeout2);
      
      // Return cleanup function
      return () => {
        timeoutIds.forEach(id => window.clearTimeout(id));
      };
      
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }, [
    getCachedImages, 
    cacheImages,
    images.length,
    INITIAL_BATCH_SIZE,
    SECOND_BATCH_SIZE,
    FINAL_BATCH_SIZE,
    SECOND_BATCH_DELAY,
    FINAL_BATCH_DELAY
  ]);

  // Load all images using smart range detection
  const loadAllImagesWithSmartDetection = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      console.log('🚀 Starting smart image detection...');
      
      const estimate = await getEstimatedImageCount();
      console.log(`📊 Quick estimate: ~${estimate} images`);
      
      const allImages = await getAllImagesWithRangeDetection();
      setImages(allImages);
      
      console.log(`✅ Loaded ${allImages.length} images using smart detection!`);
    } catch (error) {
      console.error('Error loading images with smart detection:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initialize total available images from cache
  const initializeTotalFromCache = useCallback(() => {
    const cachedRange = getCachedImageRange();
    if (cachedRange) {
      setTotalAvailableImages(cachedRange.max);
    }
  }, [getCachedImageRange]);

  return {
    images,
    loading,
    totalAvailableImages,
    loadImages,
    loadAllImagesWithSmartDetection,
    setTotalAvailableImages,
    initializeTotalFromCache
  };
};