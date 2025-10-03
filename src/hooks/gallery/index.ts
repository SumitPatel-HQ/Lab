

// Main gallery hook (optimized)
export { useGallery } from './gallery';

// Individual modular hooks
export { useImageLoader } from './loader';
export { useRandomImage } from './random';
export { useImagePreloader } from './preloader';
export { useImageCache } from './cache';

// Configuration and types
export { GALLERY_CONFIG } from './config';
export type { GalleryConfig } from './config';

// Type exports for better TypeScript support
export type { UseImageLoaderReturn } from './loader';
export type { UseRandomImageReturn } from './random';
export type { UseImagePreloaderReturn } from './preloader';
export type { ImageRange } from './cache';