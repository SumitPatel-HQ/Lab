import { IMAGEKIT_URL_ENDPOINT } from '../../services/ImageKit';

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
    THRESHOLD: 80,
    RESISTANCE: 0.4,
    VELOCITY_THRESHOLD: 0.5,
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

// Helper function to get full ImageKit URL
export const getImageKitUrl = (src: string): string => {
  if (src.startsWith('http')) {
    return src;
  }
  return `${IMAGEKIT_URL_ENDPOINT}${src}`;
};

// Helper function to generate low-quality placeholder URL
export const getPlaceholderUrl = (src: string): string => {
  const fullUrl = getImageKitUrl(src);
  if (fullUrl.includes('?')) {
    return `${fullUrl}&w=20&q=10&blur=10`;
  } else {
    return `${fullUrl}?w=20&q=10&blur=10`;
  }
};

// Helper function to generate responsive image URLs
export const getResponsiveSrcSet = (src: string): string => {
  const fullUrl = getImageKitUrl(src);
  const baseUrl = fullUrl.split('?')[0];
  
  return `
    ${baseUrl}?w=640&q=75 640w,
    ${baseUrl}?w=960&q=75 960w,
    ${baseUrl}?w=1280&q=80 1280w,
    ${baseUrl}?w=1920&q=80 1920w
  `.trim();
};

// Easing functions
export const easing = {
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInQuad: (t: number): number => t * t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
} as const;