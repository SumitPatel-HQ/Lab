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
  totalAvailableImages: number;
  loadAllImagesWithSmartDetection: () => Promise<void>;
  randomImage: () => Promise<number | undefined>;
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
  const [totalAvailableImages, setTotalAvailableImages] = useState<number>(0);
  
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

  // True random shuffle - picks from entire collection without loading everything
  const randomImage = useCallback(async () => {
    if (shuffleLoading) return undefined;
    
    setShuffleLoading(true);
    
    try {
      // Get the actual range of available images without loading them all
      const cachedRange = sessionStorage.getItem('imagekit_range');
      let imageRange;
      
      if (cachedRange) {
        imageRange = JSON.parse(cachedRange);
        console.log(`� Using cached range: 1 to ${imageRange.max} (${imageRange.max} images)`);
      } else {
        console.log('🔍 Detecting actual image range for true random shuffle...');
        const { findImageRange } = await import('../services/ImageKit/discovery');
        imageRange = await findImageRange();
        sessionStorage.setItem('imagekit_range', JSON.stringify(imageRange));
        console.log(`📊 Found range: 1 to ${imageRange.max} (${imageRange.max} total images)`);
      }
      
      const totalAvailable = imageRange.max;
      setTotalAvailableImages(totalAvailable);
      
      // Generate random image numbers until we find one that exists and is different from current
      let attempts = 0;
      let newImageNumber;
      let currentImageNumber = null;
      
      // Try to extract current image number from current image
      if (images[currentIndex]) {
        const match = images[currentIndex].src.match(/(\d+)\.jpg$/);
        if (match) {
          currentImageNumber = parseInt(match[1]);
        }
      }
      
      // Find a random image that exists and is different from current
      do {
        newImageNumber = Math.floor(Math.random() * totalAvailable) + 1;
        attempts++;
        
        // Avoid infinite loop
        if (attempts > 20) {
          console.warn('Too many attempts, falling back to current images');
          if (images.length > 1) {
            const possibleIndices = [...Array(images.length).keys()].filter(i => i !== currentIndex);
            const fallbackIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
            setShuffleLoading(false);
            return fallbackIndex;
          }
          setShuffleLoading(false);
          return undefined;
        }
      } while (newImageNumber === currentImageNumber);
      
      // Test if the random image exists
      const { getImageKitPath, testImageExists } = await import('../services/ImageKit/config');
      const imagePath = getImageKitPath(newImageNumber);
      
      console.log(`🎲 Testing random image #${newImageNumber}...`);
      
      const imageExists = await Promise.race([
        testImageExists(imagePath),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000))
      ]);
      
      if (!imageExists) {
        console.warn(`❌ Image #${newImageNumber} doesn't exist, trying another...`);
        setShuffleLoading(false);
        // Recursively try again
        return randomImage();
      }
      
      // Create image object for the random image
      const randomImageObj: ImageType = {
        id: newImageNumber.toString(),
        title: `Image ${newImageNumber}`,
        src: imagePath,
        ratio: '16:9',
        category: 'random',
        width: 800,
        height: 600
      };
      
      // Add to images array if not already present
      let newIndex = images.findIndex(img => img.src === imagePath);
      if (newIndex === -1) {
        // Add the new image to our array
        const newImages = [...images, randomImageObj];
        setImages(newImages);
        newIndex = newImages.length - 1;
        console.log(`➕ Added new image #${newImageNumber} to collection`);
      }
      
      // Preload the image
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
      }, 100);
      
      imgLoader.onload = onImageLoaded;
      imgLoader.onerror = onImageLoaded;
      imgLoader.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
      
      console.log(`� Shuffled to random image #${newImageNumber} (index ${newIndex}) from ${totalAvailable} total images`);
      return newIndex;
      
    } catch (error) {
      console.error('Error in true random shuffle:', error);
      setShuffleLoading(false);
      
      // Fallback to old method
      if (images.length > 1) {
        const possibleIndices = [...Array(images.length).keys()].filter(i => i !== currentIndex);
        return possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
      }
      return undefined;
    }
  }, [shuffleLoading, images, currentIndex, setImages]);

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
    
    // Check for cached range to show total available images immediately
    const cachedRange = sessionStorage.getItem('imagekit_range');
    if (cachedRange) {
      try {
        const range = JSON.parse(cachedRange);
        setTotalAvailableImages(range.max);
      } catch (error) {
        console.warn('Error parsing cached range:', error);
      }
    }
    
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
    totalAvailableImages,
    loadAllImagesWithSmartDetection,
    randomImage
  };
};
