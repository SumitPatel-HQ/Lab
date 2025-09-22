import { useState, useCallback } from 'react';
import { 
  getAllImages, 
  getAllImagesWithRangeDetection, 
  getEstimatedImageCount, 
  getInitialImages, 
  type ImageKitImage 
} from '../../services/ImageKit';
import { GALLERY_CONFIG } from './config';

export interface UseImageLoaderReturn {
  images: ImageKitImage[];
  loading: boolean;
  totalAvailableImages: number;
  loadImages: () => Promise<(() => void) | undefined>;
  loadAllImagesWithSmartDetection: () => Promise<void>;
  setTotalAvailableImages: (count: number) => void;
}

export const useImageLoader = (): UseImageLoaderReturn => {
  const [images, setImages] = useState<ImageKitImage[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading = true to show loading screen initially
  const [totalAvailableImages, setTotalAvailableImages] = useState<number>(0);

  const {
    INITIAL_BATCH_SIZE,
    SECOND_BATCH_SIZE,
    FINAL_BATCH_SIZE,
    SECOND_BATCH_DELAY,
    FINAL_BATCH_DELAY
  } = GALLERY_CONFIG;

  // Load images with progressive batching - NO CACHE
  const loadImages = useCallback(async () => {
    try {
      // Skip if we already have images
      if (images.length > 0) {
        console.log('✅ Images already loaded, skipping...');
        return;
      }
      
      setLoading(true);
      console.log('� Loading fresh images...');

      // Start with initial batch for immediate loading
      const initialImages = await getInitialImages(INITIAL_BATCH_SIZE);
      setImages(initialImages);
      console.log(`Loaded ${initialImages.length} images for immediate display`);
      
      // Load more images progressively with cleanup tracking
      const timeoutIds: number[] = [];
      let currentBatchSize = initialImages.length;
      
      const timeout1 = window.setTimeout(async () => {
        try {
          const batch2 = await getAllImages(SECOND_BATCH_SIZE);
          if (batch2.length > currentBatchSize) {
            setImages(batch2);
            currentBatchSize = batch2.length;
            console.log(`Expanded to ${batch2.length} total images`);
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
          if (batch3.length > currentBatchSize) {
            setImages(batch3);
            console.log(`Further expanded to ${batch3.length} total images`);
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
    images.length,
    INITIAL_BATCH_SIZE,
    SECOND_BATCH_SIZE,
    FINAL_BATCH_SIZE,
    SECOND_BATCH_DELAY,
    FINAL_BATCH_DELAY
  ]);

  // Load all images using smart range detection
  const loadAllImagesWithSmartDetection = useCallback(async () => {
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
  }, []);

  return {
    images,
    loading,
    totalAvailableImages,
    loadImages,
    loadAllImagesWithSmartDetection,
    setTotalAvailableImages
  };
};