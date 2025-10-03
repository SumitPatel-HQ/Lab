import type { ImageKitImage } from '../../services/ImageKit';

// Extract current image identifier from image src
// Now supports both numeric and non-numeric filenames
export const extractImageNumber = (image: ImageKitImage): number | null => {
  // First try to extract from traditional numeric format (1.jpg, 2.jpg, etc.)
  const match = image.src.match(/\/(\d+)\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico|heic|heif)/i);
  return match ? parseInt(match[1]) : null;
};

// Extract filename from ImageKitImage (for non-numeric names)
export const extractImageFilename = (image: ImageKitImage): string | null => {
  // Use fileName field if available
  if (image.fileName) {
    return image.fileName;
  }
  
  // Otherwise extract from src URL
  const parts = image.src.split('/');
  const lastPart = parts[parts.length - 1];
  // Remove query parameters
  const filename = lastPart.split('?')[0];
  return filename || null;
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