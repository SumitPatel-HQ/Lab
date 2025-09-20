/**
 * Gallery Configuration
 * Contains constants and configuration options for the gallery system
 */

export const GALLERY_CONFIG = {
  // Image loading configuration
  PRELOAD_COUNT: 3,
  INITIAL_BATCH_SIZE: 5,
  SECOND_BATCH_SIZE: 25,
  FINAL_BATCH_SIZE: 100,
  
  // Timing configuration (in milliseconds)
  SECOND_BATCH_DELAY: 1000,
  FINAL_BATCH_DELAY: 3000,
  PRELOAD_DELAY: 200,
  SHUFFLE_COMPLETE_DELAY: 100,
  
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