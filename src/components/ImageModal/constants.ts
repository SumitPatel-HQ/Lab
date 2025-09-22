import { IMAGEKIT_URL_ENDPOINT, createImageTransformations, getOptimizedImageUrl } from '../../services/ImageKit/config';

// Modal configuration
export const MODAL_CONFIG = {
  // Hover effects
  HOVER: {
    MAX_TILT: 5,
    SCALE_FACTOR: 1.02,
    TRANSITION_SPEED: 0.7,
    PERSPECTIVE: 1000,
    SHADOW_COLOR: 'rgba(0,0,0,0.3)',
  },
  
  // Touch and swipe
  SWIPE: {
    THRESHOLD: 60, // Reduced for better mobile accessibility
    RESISTANCE: 0.5, // Slightly increased resistance for better feel
    VELOCITY_THRESHOLD: 0.3, // Reduced for more sensitive touch detection
  },
  
  // Dismiss gesture
  DISMISS: {
    THRESHOLD: 100,
    VELOCITY_THRESHOLD: 0.5,
    ANIMATION_DURATION: 300,
    DISTANCE: typeof window !== 'undefined' ? window.innerHeight : 800,
  },
  
  // General animations
  ANIMATION: {
    DURATION: 200,
    FADE_DURATION: 300,
  },
  
  // Zoom
  ZOOM: {
    MIN: 1,
    MAX: 4,
    WHEEL_SENSITIVITY: 0.01,
  }
} as const;

// Helper function to get optimized modal image URL with adaptive quality
export const getImageKitUrl = (src: string): string => {
  if (src.startsWith('http')) {
    // Extract the path from the URL
    const imagePath = src.split('?')[0].replace(IMAGEKIT_URL_ENDPOINT, '');
    // Use ultra-high quality for modal images
    return getOptimizedImageUrl(imagePath, createImageTransformations.ultra(1600));
  }
  return getOptimizedImageUrl(src, createImageTransformations.ultra(1600));
};

// Helper function to generate low-quality placeholder URL
export const getPlaceholderUrl = (src: string): string => {
  const imagePath = src.split('?')[0].replace(IMAGEKIT_URL_ENDPOINT, '');
  return getOptimizedImageUrl(imagePath, createImageTransformations.placeholder(20));
};

// Helper function to generate high-quality responsive image URLs with WebP
export const getResponsiveSrcSet = (src: string): string => {
  const imagePath = src.split('?')[0].replace(IMAGEKIT_URL_ENDPOINT, '');
  
  return `
    ${getOptimizedImageUrl(imagePath, 'tr=q-85,f-webp,w-640')} 640w,
    ${getOptimizedImageUrl(imagePath, 'tr=q-88,f-webp,w-960')} 960w,
    ${getOptimizedImageUrl(imagePath, 'tr=q-90,f-webp,w-1280')} 1280w,
    ${getOptimizedImageUrl(imagePath, 'tr=q-93,f-webp,w-1920')} 1920w,
    ${getOptimizedImageUrl(imagePath, 'tr=q-95,f-webp,w-2560')} 2560w
  `.trim();
};

// Easing functions
export const easing = {
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInQuad: (t: number): number => t * t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
} as const;