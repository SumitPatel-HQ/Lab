// ImageKit configuration management
export const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
export const IMAGEKIT_PATH_PREFIX = import.meta.env.VITE_IMAGEKIT_PATH_PREFIX || '/AP/';

// Validate environment variables
if (!IMAGEKIT_URL_ENDPOINT) {
  console.error('⚠️  VITE_IMAGEKIT_URL_ENDPOINT is not defined in environment variables');
}

// Generate ImageKit image path
export const getImageKitPath = (imageNumber: number): string => {
  return `${IMAGEKIT_PATH_PREFIX}${imageNumber}.jpg`;
};

// Test if an image exists at the given path
export const testImageExists = async (imagePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
  });
};

// Configuration constants
export const CONFIG = {
  MAX_RANGE: 10000,
  DEFAULT_BATCH_SIZE: 15,
  DEFAULT_TIMEOUT: 1200,
  CACHE_KEY: 'imagekit_cache_v1',
  SAMPLE_INTERVAL: 50,
  MAX_CONSECUTIVE_FAILURES: 20,
} as const;
