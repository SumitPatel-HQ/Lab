import imageData from '../data/images.json';

export interface Image {
  id: string;
  title: string;
  src: string;
  ratio: string;
  category: string;
  loaded?: boolean;
  blurHash?: string;
  width?: number;
  height?: number;
}

// Global image cache to persist during page refresh
const IMAGE_CACHE_KEY = 'image_cache_v1';

// Initialize the cache from localStorage if available
let imageCache: Map<string, boolean>;

try {
  const cachedData = localStorage.getItem(IMAGE_CACHE_KEY);
  if (cachedData) {
    imageCache = new Map(JSON.parse(cachedData));
  } else {
    imageCache = new Map<string, boolean>();
  }
} catch (e) {
  console.warn('Failed to load image cache from localStorage:', e);
  imageCache = new Map<string, boolean>();
}

// Save cache to localStorage
const saveCache = () => {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(Array.from(imageCache.entries())));
  } catch (e) {
    console.warn('Failed to save image cache to localStorage:', e);
  }
};

// Improved image path correction
const correctImagePath = (path: string): string => {
  if (!path) return '';
  
  if (path.startsWith('/public/')) {
    return path.replace('/public/', '/');
  } else if (path.startsWith('fpublic/')) {
    return path.replace('fpublic/', '/');
  } else if (path.startsWith('public/')) {
    return path.replace('public/', '/');
  } else if (!path.startsWith('/') && !path.startsWith('http')) {
    return '/' + path;
  }
  return path;
};

// Actual image preloading function
export const preloadImage = (src: string): Promise<boolean> => {
  return new Promise(resolve => {
    if (imageCache.get(src)) {
      // Image already in cache, resolve immediately
      resolve(true);
      return;
    }
    
    const img = new Image();
    
    const onLoad = () => {
      imageCache.set(src, true);
      saveCache();
      resolve(true);
      cleanup();
    };
    
    const onError = () => {
      resolve(false);
      cleanup();
    };
    
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };
    
    img.onload = onLoad;
    img.onerror = onError;
    img.src = src;
    
    // For already cached images by the browser
    if (img.complete) {
      onLoad();
    }
  });
};

// Create a smaller subset of initial images for fast loading
export const getInitialImages = (count = 10): Image[] => {
  return imageData.images.slice(0, count).map((img) => ({
    id: img.id,
    title: img.title || `Image ${img.id}`,
    src: correctImagePath(img.src),
    ratio: img.ratio || '2:3',
    category: 'Imaginalab AI',
    loaded: imageCache.get(correctImagePath(img.src)) || false
  }));
};

// Load images in batches
export const getImageBatch = (startIndex: number, count: number): Image[] => {
  const endIndex = Math.min(startIndex + count, imageData.images.length);
  return imageData.images.slice(startIndex, endIndex).map((img) => ({
    id: img.id,
    title: img.title || `Image ${img.id}`,
    src: correctImagePath(img.src),
    ratio: img.ratio || '2:3',
    category: 'Imaginalab AI',
    loaded: imageCache.get(correctImagePath(img.src)) || false
  }));
};

// Mark an image as loaded in the cache
export const markImageLoaded = (imageSrc: string): void => {
  const correctedPath = correctImagePath(imageSrc);
  imageCache.set(correctedPath, true);
  saveCache();
};

// Check if an image is already loaded/cached
export const isImageLoaded = (imageSrc: string): boolean => {
  const correctedPath = correctImagePath(imageSrc);
  return imageCache.get(correctedPath) || false;
};

// Reset the image cache (useful for debugging)
export const resetImageCache = (): void => {
  imageCache.clear();
  saveCache();
};

export const getAllImages = (): Image[] => {
  // Map the JSON data to our Image interface, correcting the paths
  return imageData.images.map((img) => {
    const src = correctImagePath(img.src);
    return {
      id: img.id,
      title: img.title || `Image ${img.id}`,
      src,
      ratio: img.ratio || '2:3',
      category: 'Imaginalab AI',
      loaded: imageCache.get(src) || false
    };
  });
};

export const getImageById = (id: string): Image | undefined => {
  return getAllImages().find(image => image.id === id);
};

// Get total count of images
export const getTotalImageCount = (): number => {
  return imageData.images.length;
};

// Force preload a specific image and return it when loaded
export const getPreloadedImage = async (index: number): Promise<Image | null> => {
  if (index < 0 || index >= imageData.images.length) return null;
  
  const image = getAllImages()[index];
  await preloadImage(image.src);
  
  // Return the image with the updated loaded status
  return {
    ...image,
    loaded: true
  };
};