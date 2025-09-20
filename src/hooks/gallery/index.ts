/**
 * Gallery Hooks - Optimized and Modular
 * 
 * This module provides a complete gallery management system with:
 * - Progressive image loading with caching
 * - Smart random image selection
 * - Efficient image preloading
 * - Persistent cache management
 * 
 * Usage:
 * import { useGallery } from './hooks/gallery';
 * // or individual hooks:
 * import { useImageLoader, useRandomImage, useImagePreloader, useImageCache } from './hooks/gallery';
 */

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