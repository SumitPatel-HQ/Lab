import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getAllImages, 
  getAllImagesWithRangeDetection, 
  getEstimatedImageCount, 
  getInitialImages, 
  type ImageKitImage as ImageType,
  IMAGEKIT_URL_ENDPOINT 
} from '../services/ImageKit';

interface UseImageLoaderConfig {
  currentIndex: number;
  preloadCount?: number;
}

interface UseImageLoaderReturn {
  images: ImageType[];
  loading: boolean;
  shuffleLoading: boolean;
  visibleImageIndices: number[];
  loadAllImagesWithSmartDetection: () => Promise<void>;
  randomImage: () => void;
}

const PRELOAD_IMAGES = 3;

export const useGallery = ({ 
  currentIndex, 
  preloadCount = PRELOAD_IMAGES 
}: UseImageLoaderConfig): UseImageLoaderReturn => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [visibleImageIndices, setVisibleImageIndices] = useState<number[]>([]);
  
  const imagesLoaded = useRef(false);

  // Load images dynamically with progressive loading
  const getImages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Start with just 5 images for immediate loading
      const initialImages = await getInitialImages(5);
      setImages(initialImages);
      imagesLoaded.current = true;
      console.log(`Loaded ${initialImages.length} images for immediate display`);
      
      // Cache initial images immediately
      sessionStorage.setItem('gallery-images', JSON.stringify(initialImages));
      sessionStorage.setItem('gallery-cache-timestamp', Date.now().toString());
      
      // Load more images progressively with cleanup tracking
      const timeoutIds: number[] = [];
      
      const timeout1 = window.setTimeout(async () => {
        try {
          const batch2 = await getAllImages(25);
          if (batch2.length > initialImages.length) {
            setImages(batch2);
            console.log(`Expanded to ${batch2.length} total images`);
            // Update cache
            sessionStorage.setItem('gallery-images', JSON.stringify(batch2));
            sessionStorage.setItem('gallery-cache-timestamp', Date.now().toString());
          }
        } catch (error) {
          console.warn('Error loading additional images:', error);
        }
      }, 1000);
      timeoutIds.push(timeout1);
      
      // Load final batch
      const timeout2 = window.setTimeout(async () => {
        try {
          const batch3 = await getAllImages(100);
          if (batch3.length > 15) {
            setImages(batch3);
            console.log(`Further expanded to ${batch3.length} total images`);
            // Update cache with final batch
            sessionStorage.setItem('gallery-images', JSON.stringify(batch3));
            sessionStorage.setItem('gallery-cache-timestamp', Date.now().toString());
          }
        } catch (error) {
          console.warn('Error loading final batch:', error);
        }
      }, 3000);
      timeoutIds.push(timeout2);
      
      // Return cleanup function
      return () => {
        timeoutIds.forEach(id => window.clearTimeout(id));
      };
      
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all images using smart range detection
  const loadAllImagesWithSmartDetection = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      console.log('🚀 Starting smart image detection...');
      
      const estimate = await getEstimatedImageCount();
      console.log(`📊 Quick estimate: ~${estimate} images`);
      
      const allImages = await getAllImagesWithRangeDetection();
      setImages(allImages);
      
      console.log(`✅ Loaded ${allImages.length} images using smart detection!`);
    } catch (error) {
      console.error('Error loading images with smart detection:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Preload image function
  const preloadImage = useCallback((src: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = `${IMAGEKIT_URL_ENDPOINT}${src}`;
    });
  }, []);

  // Random image function
  const randomImage = useCallback(() => {
    if (shuffleLoading || images.length === 0) return;
    
    setShuffleLoading(true);
    
    let newIndex;
    if (images.length > 1) {
      const possibleIndices = [...Array(images.length).keys()].filter(i => i !== currentIndex);
      newIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
    } else {
      newIndex = 0;
    }
    
    const newImageSrc = images[newIndex].src;
    
    const preloadWithIdleCallback = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (callback: () => void, options: { timeout: number }) => void })
          .requestIdleCallback(callback, { timeout: 500 });
      } else {
        setTimeout(callback, 1);
      }
    };
    
    const imgLoader = new Image();
    let hasUpdated = false;
    
    const onImageLoaded = () => {
      if (!hasUpdated) {
        hasUpdated = true;
        setTimeout(() => setShuffleLoading(false), 100);
      }
    };
    
    setTimeout(() => {
      if (!hasUpdated) {
        hasUpdated = true;
        setTimeout(() => setShuffleLoading(false), 100);
      }
    }, 50);
    
    imgLoader.onload = onImageLoaded;
    imgLoader.onerror = onImageLoaded;
    
    preloadWithIdleCallback(() => {
      imgLoader.src = `${IMAGEKIT_URL_ENDPOINT}${newImageSrc}`;
    });
    
    return newIndex;
  }, [shuffleLoading, images, currentIndex]);

  // Calculate visible image indices for preloading
  useEffect(() => {
    if (images.length === 0) return;
    
    const highPriorityIndices = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length
    ];
    
    const secondaryIndices = [];
    for (let i = 2; i <= preloadCount; i++) {
      const prevIndex = (currentIndex - i + images.length) % images.length;
      const nextIndex = (currentIndex + i) % images.length;
      secondaryIndices.push(prevIndex, nextIndex);
    }
    
    setVisibleImageIndices([...highPriorityIndices, ...secondaryIndices]);
  }, [currentIndex, images.length, preloadCount]);

  // Preload visible images
  useEffect(() => {
    if (images.length === 0 || visibleImageIndices.length === 0) return;
    
    const preloadPromises = visibleImageIndices.slice(0, 3).map(index => 
      preloadImage(images[index].src)
    );
    
    Promise.all(preloadPromises).catch(() => {
      // Silently handle preloading errors
    });
  }, [visibleImageIndices, images, preloadImage]);

  // Preload current and adjacent images
  useEffect(() => {
    if (images.length === 0) return;
    
    const currentImageSrc = images[currentIndex].src;
    const preloader = new Image();
    preloader.src = `${IMAGEKIT_URL_ENDPOINT}${currentImageSrc}`;
    
    const preloadAdjacent = () => {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      const nextIndex = (currentIndex + 1) % images.length;
      
      const prevImage = new Image();
      prevImage.src = `${IMAGEKIT_URL_ENDPOINT}${images[prevIndex].src}`;
      
      const nextImage = new Image();
      nextImage.src = `${IMAGEKIT_URL_ENDPOINT}${images[nextIndex].src}`;
    };
    
    const timer = setTimeout(preloadAdjacent, 200);
    return () => clearTimeout(timer);
  }, [currentIndex, images]);

  // Initialize loading on mount with persistence check
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Check if we have cached images in sessionStorage to avoid re-loading on page revisit
    const cachedImages = sessionStorage.getItem('gallery-images');
    const cacheTimestamp = sessionStorage.getItem('gallery-cache-timestamp');
    const cacheAge = Date.now() - (parseInt(cacheTimestamp || '0'));
    
    // Use cache if it's less than 5 minutes old
    if (cachedImages && cacheAge < 5 * 60 * 1000) {
      try {
        const parsed = JSON.parse(cachedImages);
        if (parsed.length > 0) {
          console.log(`🚀 Restored ${parsed.length} images from cache - no lag!`);
          setImages(parsed);
          setLoading(false);
          imagesLoaded.current = true;
          return;
        }
      } catch (error) {
        console.warn('Error parsing cached images, fetching fresh:', error);
      }
    }
    
    // Only fetch if no valid cache
    getImages().then((cleanupFn) => {
      cleanup = cleanupFn;
    });
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [getImages]);

  return {
    images,
    loading,
    shuffleLoading,
    visibleImageIndices,
    loadAllImagesWithSmartDetection,
    randomImage
  };
};
