import type { ImageKitImage } from '../../services/ImageKit';

// Extract current image number from image src
export const extractImageNumber = (image: ImageKitImage): number | null => {
  const match = image.src.match(/(\d+)\.jpg$/);
  return match ? parseInt(match[1]) : null;
};

// Generate random number excluding current
export const generateRandomNumber = (max: number, exclude: number | null, maxAttempts: number): number | null => {
  let attempts = 0;
  let randomNumber;
  
  do {
    randomNumber = Math.floor(Math.random() * max) + 1;
    attempts++;
    
    if (attempts > maxAttempts) {
      return null; // Give up after max attempts
    }
  } while (randomNumber === exclude);
  
  return randomNumber;
};

// Fallback to existing images when random fails
export const getFallbackIndex = (images: ImageKitImage[], currentIndex: number): number | null => {
  if (images.length <= 1) return null;
  
  const possibleIndices = [...Array(images.length).keys()].filter(i => i !== currentIndex);
  return possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
};

// Check if image already exists in array
export const findImageIndex = (images: ImageKitImage[], imagePath: string): number => {
  return images.findIndex(img => img.src === imagePath);
};

// Add new image to array
export const addImageToArray = (images: ImageKitImage[], newImage: ImageKitImage): { images: ImageKitImage[]; index: number } => {
  const existingIndex = findImageIndex(images, newImage.src);
  
  if (existingIndex !== -1) {
    return { images, index: existingIndex };
  }
  
  const updatedImages = [...images, newImage];
  return { images: updatedImages, index: updatedImages.length - 1 };
};