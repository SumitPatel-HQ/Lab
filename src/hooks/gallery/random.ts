import { useState, useCallback } from 'react';
import type { ImageKitImage } from '../../services/ImageKit';
import { useImageCache } from './cache';
import { GALLERY_CONFIG } from './config';
import { extractImageNumber, getFallbackIndex, addImageToArray } from './randomUtils';
import { createImageObject, testImageExistence, preloadImage } from './randomImageService';

export interface UseRandomImageReturn {
  shuffleLoading: boolean;
  randomImage: (images: ImageKitImage[], currentIndex: number) => Promise<{ index: number; images: ImageKitImage[] } | undefined>;
}

export const useRandomImage = (
  setTotalAvailableImages: (count: number) => void
): UseRandomImageReturn => {
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const { getCachedImageRange, cacheImageRange } = useImageCache();

  const randomImage = useCallback(async (
    images: ImageKitImage[], 
    currentIndex: number
  ): Promise<{ index: number; images: ImageKitImage[] } | undefined> => {
    if (shuffleLoading) return undefined;
    
    // Check if we have images to work with
    if (images.length === 0) {
      console.warn('⚠️ No images available for shuffle');
      return undefined;
    }
    
    setShuffleLoading(true);
    
    try {
      // Get or detect image range
      let imageRange = getCachedImageRange();
      
      if (!imageRange) {
        console.log('🔍 Detecting actual image range for true random shuffle...');
        try {
          const { findImageRange } = await import('../../services/ImageKit/discovery');
          imageRange = await findImageRange();
          cacheImageRange(imageRange);
          console.log(`📊 Found range: 1 to ${imageRange.max} (${imageRange.max} total images)`);
        } catch (rangeError) {
          console.error('❌ Failed to detect image range:', rangeError);
          // Fallback: use current images length as estimate
          imageRange = { max: Math.max(100, images.length * 2) };
          console.log(`🔄 Using fallback range: 1 to ${imageRange.max} (estimated)`);
        }
      } else {
        console.log(`💾 Using cached range: 1 to ${imageRange.max} (${imageRange.max} images)`);
      }
      
      // Validate image range
      if (!imageRange || imageRange.max < 1) {
        console.error('❌ Invalid image range, cannot shuffle');
        setShuffleLoading(false);
        return undefined;
      }
      
      setTotalAvailableImages(imageRange.max);
      
      // Extract current image number and generate random
      const currentImageNumber = images[currentIndex] ? extractImageNumber(images[currentIndex]) : null;
      let attempts = 0;
      let randomNumber;
      
      do {
        randomNumber = Math.floor(Math.random() * imageRange.max) + 1;
        attempts++;
        
        if (attempts > GALLERY_CONFIG.MAX_RANDOM_ATTEMPTS) {
          const fallbackIndex = getFallbackIndex(images, currentIndex);
          setShuffleLoading(false);
          return fallbackIndex !== null ? { index: fallbackIndex, images } : undefined;
        }
      } while (randomNumber === currentImageNumber);
      
      // Test if image exists
      const { getImageKitPath } = await import('../../services/ImageKit/config');
      const imagePath = getImageKitPath(randomNumber);
      
      console.log(`🎲 Testing random image #${randomNumber}...`);
      
      const imageExists = await testImageExistence(imagePath, GALLERY_CONFIG.IMAGE_EXIST_TIMEOUT);
      
      if (!imageExists) {
        console.warn(`❌ Image #${randomNumber} doesn't exist, trying another...`);
        setShuffleLoading(false);
        return randomImage(images, currentIndex); // Retry
      }
      
      // Create and add image
      // Create and add image
      console.log(`🔍 Getting metadata for random image: ${imagePath}`);
      const randomImageObj = await createImageObject(randomNumber, imagePath);
      const { images: updatedImages, index: newIndex } = addImageToArray(images, randomImageObj);
      
      if (newIndex === updatedImages.length - 1) {
        console.log(`➕ Added new image #${randomNumber} to collection`);
      }
      
      // Handle loading completion
      let hasCompleted = false;
      const complete = () => {
        if (!hasCompleted) {
          hasCompleted = true;
          setTimeout(() => setShuffleLoading(false), GALLERY_CONFIG.SHUFFLE_COMPLETE_DELAY);
        }
      };
      
      // Auto-complete and preload
      setTimeout(complete, GALLERY_CONFIG.SHUFFLE_COMPLETE_DELAY);
      preloadImage(imagePath, complete);
      
      console.log(`🎯 Shuffled to random image #${randomNumber} (index ${newIndex}) from ${imageRange.max} total images`);
      return { index: newIndex, images: updatedImages };
      
    } catch (error) {
      console.error('Error in true random shuffle:', error);
      setShuffleLoading(false);
      
      const fallbackIndex = getFallbackIndex(images, currentIndex);
      return fallbackIndex !== null ? { index: fallbackIndex, images } : undefined;
    }
  }, [shuffleLoading, getCachedImageRange, cacheImageRange, setTotalAvailableImages]);

  return { shuffleLoading, randomImage };
};