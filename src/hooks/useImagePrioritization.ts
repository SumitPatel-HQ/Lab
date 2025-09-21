// Smart image loading prioritizer for optimal performance
import { useState, useEffect, useCallback } from 'react';
import type { ImageKitImage } from '../services/ImageKit';

interface UseImagePrioritizationOptions {
  images: ImageKitImage[];
  currentIndex: number;
  viewportImages?: number; // Number of images visible in viewport
}

interface ImagePriority {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  shouldPreload: boolean;
}

export const useImagePrioritization = ({
  images,
  currentIndex,
  viewportImages = 4
}: UseImagePrioritizationOptions) => {
  const [imagePriorities, setImagePriorities] = useState<Map<string, ImagePriority>>(new Map());

  const calculatePriorities = useCallback(() => {
    const priorities = new Map<string, ImagePriority>();

    images.forEach((image, index) => {
      const distance = Math.abs(index - currentIndex);
      
      let priority: ImagePriority['priority'];
      let shouldPreload: boolean;

      if (index === currentIndex) {
        // Current image - highest priority
        priority = 'critical';
        shouldPreload = true;
      } else if (distance === 1) {
        // Adjacent images - high priority
        priority = 'high';
        shouldPreload = true;
      } else if (distance <= 3) {
        // Nearby images - medium priority
        priority = 'medium';
        shouldPreload = true;
      } else if (distance <= viewportImages) {
        // Viewport images - low priority but still preload
        priority = 'low';
        shouldPreload = true;
      } else {
        // Far images - no preloading
        priority = 'low';
        shouldPreload = false;
      }

      priorities.set(image.id, {
        id: image.id,
        priority,
        shouldPreload
      });
    });

    setImagePriorities(priorities);
  }, [images, currentIndex, viewportImages]);

  useEffect(() => {
    calculatePriorities();
  }, [calculatePriorities]);

  const getImagePriority = useCallback((imageId: string): ImagePriority | undefined => {
    return imagePriorities.get(imageId);
  }, [imagePriorities]);

  const getCriticalImages = useCallback((): ImageKitImage[] => {
    return images.filter(image => 
      imagePriorities.get(image.id)?.priority === 'critical'
    );
  }, [images, imagePriorities]);

  const getHighPriorityImages = useCallback((): ImageKitImage[] => {
    return images.filter(image => 
      imagePriorities.get(image.id)?.priority === 'high'
    );
  }, [images, imagePriorities]);

  const getPreloadableImages = useCallback((): ImageKitImage[] => {
    return images.filter(image => 
      imagePriorities.get(image.id)?.shouldPreload
    );
  }, [images, imagePriorities]);

  // Get loading priority for fetchpriority attribute
  const getLoadingPriority = useCallback((imageId: string): 'high' | 'low' | 'auto' => {
    const priority = getImagePriority(imageId);
    if (!priority) return 'auto';
    
    switch (priority.priority) {
      case 'critical':
        return 'high';
      case 'high':
        return 'high';
      default:
        return 'low';
    }
  }, [getImagePriority]);

  // Get loading behavior for loading attribute
  const getLoadingBehavior = useCallback((imageId: string): 'eager' | 'lazy' => {
    const priority = getImagePriority(imageId);
    if (!priority) return 'lazy';
    
    return priority.priority === 'critical' || priority.priority === 'high' ? 'eager' : 'lazy';
  }, [getImagePriority]);

  return {
    getImagePriority,
    getCriticalImages,
    getHighPriorityImages, 
    getPreloadableImages,
    getLoadingPriority,
    getLoadingBehavior,
    totalImages: images.length,
    preloadableCount: getPreloadableImages().length
  };
};