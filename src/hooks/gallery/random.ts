import { useState, useCallback } from 'react';
import { type ImageKitImage, IMAGEKIT_URL_ENDPOINT } from '../../services/ImageKit';
import { useImageCache, type ImageRange } from './cache';
import { GALLERY_CONFIG } from './config';

export interface UseRandomImageReturn {
  shuffleLoading: boolean;
  randomImage: (images: ImageKitImage[], currentIndex: number) => Promise<{ index: number; images: ImageKitImage[] } | undefined>;
}

export const useRandomImage = (
  setTotalAvailableImages: (count: number) => void
): UseRandomImageReturn => {
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const { getCachedImageRange, cacheImageRange } = useImageCache();

  const {
    MAX_RANDOM_ATTEMPTS,
    IMAGE_EXIST_TIMEOUT,
    SHUFFLE_COMPLETE_DELAY,
    DEFAULT_IMAGE_RATIO,
    DEFAULT_IMAGE_WIDTH,
    DEFAULT_IMAGE_HEIGHT,
    DEFAULT_CATEGORY
  } = GALLERY_CONFIG;

  // True random shuffle - picks from entire collection without loading everything
  const randomImage = useCallback(async (
    images: ImageKitImage[], 
    currentIndex: number
  ) => {
    if (shuffleLoading) return undefined;
    
    setShuffleLoading(true);
    
    try {
      // Get the actual range of available images without loading them all
      let imageRange: ImageRange | null = getCachedImageRange();
      
      if (imageRange) {
        console.log(`💾 Using cached range: 1 to ${imageRange.max} (${imageRange.max} images)`);
      } else {
        console.log('🔍 Detecting actual image range for true random shuffle...');
        const { findImageRange } = await import('../../services/ImageKit/discovery');
        imageRange = await findImageRange();
        cacheImageRange(imageRange);
        console.log(`📊 Found range: 1 to ${imageRange.max} (${imageRange.max} total images)`);
      }
      
      const totalAvailable = imageRange.max;
      setTotalAvailableImages(totalAvailable);
      
      // Generate random image numbers until we find one that exists and is different from current
      let attempts = 0;
      let newImageNumber;
      let currentImageNumber = null;
      
      // Try to extract current image number from current image
      if (images[currentIndex]) {
        const match = images[currentIndex].src.match(/(\d+)\.jpg$/);
        if (match) {
          currentImageNumber = parseInt(match[1]);
        }
      }
      
      // Find a random image that exists and is different from current
      do {
        newImageNumber = Math.floor(Math.random() * totalAvailable) + 1;
        attempts++;
        
        // Avoid infinite loop
        if (attempts > MAX_RANDOM_ATTEMPTS) {
          console.warn('Too many attempts, falling back to current images');
          if (images.length > 1) {
            const possibleIndices = [...Array(images.length).keys()].filter(i => i !== currentIndex);
            const fallbackIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
            setShuffleLoading(false);
            return { index: fallbackIndex, images };
          }
          setShuffleLoading(false);
          return undefined;
        }
      } while (newImageNumber === currentImageNumber);
      
      // Test if the random image exists
      const { getImageKitPath, testImageExists } = await import('../../services/ImageKit/config');
      const imagePath = getImageKitPath(newImageNumber);
      
      console.log(`🎲 Testing random image #${newImageNumber}...`);
      
      const imageExists = await Promise.race([
        testImageExists(imagePath),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), IMAGE_EXIST_TIMEOUT))
      ]);
      
      if (!imageExists) {
        console.warn(`❌ Image #${newImageNumber} doesn't exist, trying another...`);
        setShuffleLoading(false);
        // Recursively try again
        return randomImage(images, currentIndex);
      }
      
      // Create image object for the random image
      const randomImageObj: ImageKitImage = {
        id: newImageNumber.toString(),
        title: `Image ${newImageNumber}`,
        src: imagePath,
        ratio: DEFAULT_IMAGE_RATIO,
        category: DEFAULT_CATEGORY,
        width: DEFAULT_IMAGE_WIDTH,
        height: DEFAULT_IMAGE_HEIGHT
      };
      
      // Add to images array if not already present
      let newIndex = images.findIndex(img => img.src === imagePath);
      let updatedImages = images;
      if (newIndex === -1) {
        // Add the new image to our array
        updatedImages = [...images, randomImageObj];
        newIndex = updatedImages.length - 1;
        console.log(`➕ Added new image #${newImageNumber} to collection`);
      }
      
      // Preload the image
      const imgLoader = new Image();
      let hasUpdated = false;
      
      const onImageLoaded = () => {
        if (!hasUpdated) {
          hasUpdated = true;
          setTimeout(() => setShuffleLoading(false), SHUFFLE_COMPLETE_DELAY);
        }
      };
      
      setTimeout(() => {
        if (!hasUpdated) {
          hasUpdated = true;
          setTimeout(() => setShuffleLoading(false), SHUFFLE_COMPLETE_DELAY);
        }
      }, SHUFFLE_COMPLETE_DELAY);
      
      imgLoader.onload = onImageLoaded;
      imgLoader.onerror = onImageLoaded;
      imgLoader.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
      
      console.log(`🎯 Shuffled to random image #${newImageNumber} (index ${newIndex}) from ${totalAvailable} total images`);
      return { index: newIndex, images: updatedImages };
      
    } catch (error) {
      console.error('Error in true random shuffle:', error);
      setShuffleLoading(false);
      
      // Fallback to old method
      if (images.length > 1) {
        const possibleIndices = [...Array(images.length).keys()].filter(i => i !== currentIndex);
        const fallbackIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        return { index: fallbackIndex, images };
      }
      return undefined;
    }
  }, [
    shuffleLoading, 
    getCachedImageRange, 
    cacheImageRange, 
    setTotalAvailableImages,
    MAX_RANDOM_ATTEMPTS,
    IMAGE_EXIST_TIMEOUT,
    SHUFFLE_COMPLETE_DELAY,
    DEFAULT_IMAGE_RATIO,
    DEFAULT_IMAGE_WIDTH,
    DEFAULT_IMAGE_HEIGHT,
    DEFAULT_CATEGORY
  ]);

  return {
    shuffleLoading,
    randomImage
  };
};