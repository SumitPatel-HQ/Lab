// Enhanced ImageKit configuration with smart image transformations
export const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
export const IMAGEKIT_PATH_PREFIX = import.meta.env.VITE_IMAGEKIT_PATH_PREFIX || '/AP/';

// Validate environment variables
if (!IMAGEKIT_URL_ENDPOINT) {
  console.error('⚠️  VITE_IMAGEKIT_URL_ENDPOINT is not defined in environment variables');
}

// High-quality image transformation builders - Enhanced for premium visual experience
export const createImageTransformations = {
  // High-quality thumbnail for grid view - maintains sharp details
  thumbnail: (width = 400) => `tr=q-85,f-webp,w-${width}`,
  
  // Low-quality placeholder for progressive loading (keep this low for fast loading)
  placeholder: (width = 50) => `tr=q-20,f-webp,w-${width},bl-10`,
  
  // Premium quality for modal preview - crisp and detailed
  preview: (width = 800) => `tr=q-90,f-webp,w-${width}`,
  
  // Maximum quality for full view - near-lossless
  fullSize: (width = 1200) => `tr=q-95,f-webp,w-${width}`,
  
  // Device-optimized high-quality transformations - no compromise on visual quality
  responsive: (deviceType: 'mobile' | 'tablet' | 'desktop') => {
    switch (deviceType) {
      case 'mobile':
        // High quality for mobile - sharp images even on high-DPI screens
        return 'tr=q-85,f-webp,w-700';
      case 'tablet':
        // Premium quality for tablets - excellent for larger mobile screens
        return 'tr=q-88,f-webp,w-1000';
      case 'desktop':
        // Maximum quality for desktop - crystal clear images
        return 'tr=q-92,f-webp,w-1400';
      default:
        // Default high quality
        return 'tr=q-88,f-webp,w-900';
    }
  },
  
  // New: Ultra-high quality for special cases (hero images, featured content)
  ultra: (width = 1600) => `tr=q-100,f-auto,w-${width},dpr-2.0,c-maintain_ratio`,
  
  // New: Retina/high-DPI optimized versions
  retina: (deviceType: 'mobile' | 'tablet' | 'desktop') => {
    switch (deviceType) {
      case 'mobile':
        return 'tr=q-88,f-webp,w-1400'; // 2x mobile resolution
      case 'tablet':
        return 'tr=q-90,f-webp,w-2000'; // 2x tablet resolution
      case 'desktop':
        return 'tr=q-93,f-webp,w-2800'; // 2x desktop resolution
      default:
        return 'tr=q-90,f-webp,w-1800';
    }
  }
};

// Generate ImageKit image path
export const getImageKitPath = (imageNumber: number): string => {
  return `${IMAGEKIT_PATH_PREFIX}${imageNumber}.jpg`;
};

// Generate optimized image URL with transformations
export const getOptimizedImageUrl = (
  imagePath: string, 
  transformation: string
): string => {
  return `${IMAGEKIT_URL_ENDPOINT}${imagePath}?${transformation}`;
};

// Test if an image exists at the given path (with fast, tiny preview)
export const testImageExists = async (imagePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    // Use smallest possible image for existence test
    img.src = getOptimizedImageUrl(imagePath, 'tr=q-20,f-webp,w-10');
  });
};

// Configuration constants
export const CONFIG = {
  MAX_RANGE: 10000,
  DEFAULT_BATCH_SIZE: 6, // Smaller batches for high-quality images
  DEFAULT_TIMEOUT: 1500, // Increased timeout for high-quality loading
  CACHE_KEY: 'imagekit_cache_v3', // Updated cache version for high quality
  SAMPLE_INTERVAL: 50,
  MAX_CONSECUTIVE_FAILURES: 12,
  
  // Progressive loading delays - optimized for quality
  PLACEHOLDER_DELAY: 0,
  THUMBNAIL_DELAY: 150, // Slightly longer for better quality
  PREVIEW_DELAY: 400,   // Allow time for high-quality preview
  FULLSIZE_DELAY: 800,  // More time for ultra-high quality
} as const;

// Enhanced device and capability detection
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Detect if device has high-DPI screen (Retina, etc.)
export const isHighDPIDevice = (): boolean => {
  return window.devicePixelRatio > 1.5;
};

// Detect connection quality for adaptive quality
export const getConnectionQuality = (): 'slow' | 'fast' | 'unknown' => {
  // @ts-expect-error - navigator.connection might not be available in all browsers
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return 'unknown';
  
  // Slow connections: 2G, slow-2g, or effective type is slow
  if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || 
      (connection.downlink && connection.downlink < 1.5)) {
    return 'slow';
  }
  
  return 'fast';
};

// Smart quality selector based on device capabilities and connection
export const getOptimalQuality = (baseQuality: 'thumbnail' | 'preview' | 'fullSize', deviceType?: 'mobile' | 'tablet' | 'desktop') => {
  const device = deviceType || getDeviceType();
  const isHighDPI = isHighDPIDevice();
  const connectionQuality = getConnectionQuality();
  
  // For slow connections, use standard quality
  if (connectionQuality === 'slow') {
    switch (baseQuality) {
      case 'thumbnail':
        return createImageTransformations.thumbnail(400);
      case 'preview':
        return createImageTransformations.preview(800);
      case 'fullSize':
        return createImageTransformations.fullSize(1200);
    }
  }
  
  // For high-DPI devices with good connections, use retina quality
  if (isHighDPI && connectionQuality === 'fast') {
    return createImageTransformations.retina(device);
  }
  
  // Default to responsive high quality
  return createImageTransformations.responsive(device);
};
