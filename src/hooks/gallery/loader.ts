import { useState, useCallback } from 'react';
import { 
  getAllImagesWithRangeDetection,
  getAllImagesFromAPI, // NEW: API-based discovery for any filename
  type ImageKitImage 
} from '../../services/ImageKit';

export interface UseImageLoaderReturn {
  images: ImageKitImage[];
  loading: boolean;
  totalAvailableImages: number;
  loadImages: () => Promise<void>; // Updated return type
  loadAllImagesWithSmartDetection: () => Promise<void>;
  setTotalAvailableImages: (count: number) => void;
}

export const useImageLoader = (): UseImageLoaderReturn => {
  const [images, setImages] = useState<ImageKitImage[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading = true to show loading screen initially
  const [totalAvailableImages, setTotalAvailableImages] = useState<number>(0);

  // Load images with progressive batching - NOW USING API-BASED DISCOVERY
  const loadImages = useCallback(async () => {
    try {
      // Skip if we already have images
      if (images.length > 0) {
        console.log('✅ Images already loaded, skipping...');
        return;
      }
      
      setLoading(true);
      console.log('🚀 Loading images using API-based discovery...');

      // NEW: Use API to fetch ALL files with any name/type
      const allImages = await getAllImagesFromAPI();
      setImages(allImages);
      setTotalAvailableImages(allImages.length);
      console.log(`✅ Loaded ${allImages.length} images from ImageKit API`);
      setLoading(false);
      return;
      
      // No need for progressive batching with API - we get all files at once!
      
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }, [images.length]); // Simplified dependencies

  // Load all images using API-based discovery (supports any filename)
  const loadAllImagesWithSmartDetection = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚀 Using API-based discovery for all files...');
      
      const allImages = await getAllImagesFromAPI();
      setImages(allImages);
      setTotalAvailableImages(allImages.length);
      
      console.log(`✅ Loaded ${allImages.length} images from ImageKit API!`);
    } catch (error) {
      console.error('Error loading images from API:', error);
      // Fallback to legacy method if API fails
      console.log('⚠️ Falling back to legacy discovery...');
      try {
        const allImages = await getAllImagesWithRangeDetection();
        setImages(allImages);
        setTotalAvailableImages(allImages.length);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
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