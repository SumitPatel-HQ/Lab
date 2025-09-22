import { type ImageKitImage, IMAGEKIT_URL_ENDPOINT } from '../../services/ImageKit';
import { getImageMetadata } from '../../services/ImageKit/loader';
import { GALLERY_CONFIG } from './config';

const { DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT, DEFAULT_CATEGORY } = GALLERY_CONFIG;

// Create ImageKitImage object from image number and path
export const createImageObject = async (imageNumber: number, imagePath: string): Promise<ImageKitImage> => {
  const metadata = await getImageMetadata(imagePath);
  
  // Import ImageKit functions for proper URL generation
  const { getOptimizedImageUrl, getOptimalQuality, getDeviceType } = await import('../../services/ImageKit/config');
  const deviceType = getDeviceType();
  
  return {
    id: imageNumber.toString(),
    title: 'ImaginaLab',
    src: getOptimizedImageUrl(imagePath, getOptimalQuality('thumbnail', deviceType)),
    ratio: metadata.ratio,
    category: DEFAULT_CATEGORY,
    width: DEFAULT_IMAGE_WIDTH,
    height: DEFAULT_IMAGE_HEIGHT,
    loaded: false
  };
};

// Test if image exists with timeout
export const testImageExistence = async (imagePath: string, timeout: number): Promise<boolean> => {
  const { testImageExists } = await import('../../services/ImageKit/config');
  
  return Promise.race([
    testImageExists(imagePath),
    new Promise<boolean>(resolve => setTimeout(() => resolve(false), timeout))
  ]);
};

// Preload image with callbacks
export const preloadImage = (imagePath: string, onComplete: () => void): void => {
  const imgLoader = new Image();
  
  imgLoader.onload = onComplete;
  imgLoader.onerror = onComplete;
  imgLoader.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
};