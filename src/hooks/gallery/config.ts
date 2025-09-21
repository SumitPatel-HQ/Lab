/**
 * Gallery Configuration
 * Contains constants and configuration options for the gallery system
 */

export const GALLERY_CONFIG = {
  // Image loading configuration - optimized for faster loading
  PRELOAD_COUNT: 2, // Reduced for faster initial load
  INITIAL_BATCH_SIZE: 3, // Smaller initial batch for ultra-fast startup
  SECOND_BATCH_SIZE: 12, // Reduced batch size
  FINAL_BATCH_SIZE: 50, // Reduced final batch
  
  // Timing configuration (in milliseconds) - more aggressive loading
  SECOND_BATCH_DELAY: 500, // Faster second batch
  FINAL_BATCH_DELAY: 1500, // Faster final batch
  PRELOAD_DELAY: 100, // Faster preloading
  SHUFFLE_COMPLETE_DELAY: 50, // Faster shuffle
  
  // Cache configuration
  CACHE_EXPIRY_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_KEYS: {
    IMAGES: 'gallery-images',
    TIMESTAMP: 'gallery-cache-timestamp',
    IMAGE_RANGE: 'imagekit_range'
  } as const,
  
  // Random image configuration
  MAX_RANDOM_ATTEMPTS: 20,
  IMAGE_EXIST_TIMEOUT: 2000,
  
  // Image properties
  DEFAULT_IMAGE_RATIO: '16:9' as const,
  DEFAULT_IMAGE_WIDTH: 800,
  DEFAULT_IMAGE_HEIGHT: 600,
  DEFAULT_CATEGORY: 'random' as const
} as const;

export type GalleryConfig = typeof GALLERY_CONFIG;