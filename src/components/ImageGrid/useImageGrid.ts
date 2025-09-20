import { useState, useEffect, useCallback } from 'react';
import { getAllImages, type ImageKitImage as Image } from '../../services/ImageKit';

interface UseImageGridReturn {
  allImages: Image[];
  visibleImages: Image[];
  hasMore: boolean;
  isInitialLoading: boolean;
  fetchMoreData: () => void;
}

export const useImageGrid = (initialImages: Image[]): UseImageGridReturn => {
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [visibleImages, setVisibleImages] = useState<Image[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const INITIAL_LOAD = 30;
  const IMAGES_PER_LOAD = 15;

  // Load all images once at startup
  useEffect(() => {
    const loadAllImages = async () => {
      try {
        setIsInitialLoading(true);
        console.log('🔍 Discovering all available images...');
        const allDiscoveredImages = await getAllImages();
        console.log(`✅ Found ${allDiscoveredImages.length} total images`);
        
        setAllImages(allDiscoveredImages);
        setVisibleImages(allDiscoveredImages.slice(0, INITIAL_LOAD));
        setHasMore(allDiscoveredImages.length > INITIAL_LOAD);
      } catch (error) {
        console.error('Error loading images:', error);
        // Fallback to initial images if discovery fails
        setAllImages(initialImages);
        setVisibleImages(initialImages.slice(0, INITIAL_LOAD));
        setHasMore(initialImages.length > INITIAL_LOAD);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadAllImages();
  }, [initialImages]);

  // Load more images for infinite scroll
  const fetchMoreData = useCallback(() => {
    if (visibleImages.length >= allImages.length) {
      setHasMore(false);
      return;
    }

    console.log(`📦 Loading more images... (${visibleImages.length}/${allImages.length})`);
    
    // Load next batch with small delay for smooth experience
    setTimeout(() => {
      const nextImages = allImages.slice(
        visibleImages.length, 
        visibleImages.length + IMAGES_PER_LOAD
      );
      
      setVisibleImages(prev => [...prev, ...nextImages]);
      
      // Check if we have more to load
      setHasMore(visibleImages.length + nextImages.length < allImages.length);
    }, 300);
  }, [visibleImages.length, allImages]);

  return {
    allImages,
    visibleImages,
    hasMore,
    isInitialLoading,
    fetchMoreData
  };
};