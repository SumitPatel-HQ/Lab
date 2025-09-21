// Main ImageKit service - Clean public API (40 lines vs 597!)
import type { ImageKitImage } from './types';
import { findImageRange, getEstimatedImageCount, getTotalImageCount } from './discovery';
import { 
  discoverAvailableImages, 
  getAllImagesInRange, 
  discoverImagesProgressively,
  getImageById,
  getImageWithRatio,
  getPreloadedImage,
  getImageMetadata
} from './loader';

// Re-export cache functions
export { preloadImageKit, markImageLoaded, isImageLoaded, resetImageCache } from './cache';

// Re-export loader functions
export { getImageMetadata } from './loader';

// Re-export types
export type { ImageKitImage } from './types';

// Re-export config
export { IMAGEKIT_URL_ENDPOINT } from './config';

// Main API functions

// Get all images with smart range detection
export const getAllImagesWithRangeDetection = async (): Promise<ImageKitImage[]> => {
  console.log('🔍 Detecting actual image range...');
  
  try {
    const range = await findImageRange();
    console.log(`📊 Found image range: ${range.min} to ${range.max} (${range.max} total images)`);
    
    const images = await getAllImagesInRange(range.min, range.max);
    console.log(`✅ Successfully loaded ${images.length} out of ${range.max} possible images`);
    return images;
    
  } catch (error) {
    console.error('Error in smart range detection, falling back to sequential discovery:', error);
    return discoverAvailableImages(500);
  }
};

// Get all images with smart caching (avoid loading all at once)
export const getAllImages = async (maxCount: number = 2000): Promise<ImageKitImage[]> => {
  return discoverAvailableImages(maxCount);
};

// Create a smaller subset of initial images for ULTRA FAST loading
export const getInitialImages = async (count = 5): Promise<ImageKitImage[]> => {
  return discoverAvailableImages(Math.min(count, 5));
};

// Load images in batches with progressive discovery
export const getImageBatch = async (startIndex: number, count: number): Promise<ImageKitImage[]> => {
  return discoverImagesProgressively(startIndex, count);
};

// Get ALL images for "Show All" functionality
export const getAllImagesComplete = async (): Promise<ImageKitImage[]> => {
  const estimate = await getEstimatedImageCount();
  return getAllImagesInRange(1, Math.min(estimate, 500));
};

// Re-export utility functions
export { 
  getAllImagesInRange,
  getImageById, 
  getImageWithRatio, 
  getPreloadedImage,
  getEstimatedImageCount,
  getTotalImageCount 
};
