import { useEffect, useState, useCallback } from 'react';
import { type ImageKitImage } from '../../services/ImageKit';
import { useImageLoader } from './loader';
import { useRandomImage } from './random';
import { useImagePreloader } from './preloader';
import { GALLERY_CONFIG } from './config';

interface UseGalleryConfig {
  currentIndex: number;
  preloadCount?: number;
}

interface UseGalleryReturn {
  images: ImageKitImage[];
  loading: boolean;
  shuffleLoading: boolean;
  visibleImageIndices: number[];
  totalAvailableImages: number;
  loadAllImagesWithSmartDetection: () => Promise<void>;
  randomImage: () => Promise<number | undefined>;
}

export const useGallery = ({ 
  currentIndex, 
  preloadCount = GALLERY_CONFIG.PRELOAD_COUNT
}: UseGalleryConfig): UseGalleryReturn => {
  
  // Local state for images (to allow updates from random image)
  const [localImages, setLocalImages] = useState<ImageKitImage[]>([]);
  
  // Use modular hooks
  const {
    images: loaderImages,
    loading,
    totalAvailableImages,
    loadImages,
    loadAllImagesWithSmartDetection,
    setTotalAvailableImages
  } = useImageLoader();

  const { shuffleLoading, randomImage: randomImageFn } = useRandomImage(setTotalAvailableImages);
  
  // Use local images or loader images
  const images = localImages.length > 0 ? localImages : loaderImages;
  const { visibleImageIndices } = useImagePreloader(currentIndex, images, preloadCount);

  // Update local images when loader images change
  useEffect(() => {
    if (loaderImages.length > 0 && localImages.length === 0) {
      setLocalImages(loaderImages);
    }
  }, [loaderImages, localImages.length]);

  // Wrapper for random image function to match original interface
  const randomImage = useCallback(async (): Promise<number | undefined> => {
    const result = await randomImageFn(images, currentIndex);
    if (result) {
      setLocalImages(result.images);
      return result.index;
    }
    return undefined;
  }, [randomImageFn, images, currentIndex]);

  // Initialize on mount
  useEffect(() => {
    // Load images (no cleanup needed with API-based discovery)
    loadImages();
  }, [loadImages]);

  return {
    images,
    loading,
    shuffleLoading,
    visibleImageIndices,
    totalAvailableImages,
    loadAllImagesWithSmartDetection,
    randomImage
  };
};