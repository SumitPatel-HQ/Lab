// ImageKit service for handling image operations
export interface ImageKitImage {
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

// ImageKit f// Get all images with smart range detection
export const getAllImagesWithRangeDetection = async (): Promise<ImageKitImage[]> => {
  console.log('🔍 Detecting actual image range...');
  
  try {
    // Find the actual range of images
    const range = await findImageRange();
    console.log(`📊 Found image range: ${range.min} to ${range.max} (${range.max} total images)`);
    
    // Now load all images in that range efficiently
    const images: ImageKitImage[] = [];
    const batchSize = 10;
    
    for (let i = range.min; i <= range.max; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && (i + j) <= range.max; j++) {
        const imageNumber = i + j;
        const imagePath = getImageKitPath(imageNumber);
        batch.push({ imageNumber, imagePath });
      }
      
      const results = await Promise.all(
        batch.map(async ({ imageNumber, imagePath }) => {
          try {
            const exists = await Promise.race([
              testImageExists(imagePath),
              new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000))
            ]);
            
            if (exists) {
              const metadata = await getImageMetadata(imagePath);
              return {
                id: `image-${imageNumber}`,
                title: imageNumber.toString(),
                src: `${IMAGEKIT_URL_ENDPOINT}${imagePath}?tr=q-95,f-auto`,
                ratio: metadata.ratio,
                category: 'Imaginalab AI',
                loaded: false
              };
            }
          } catch (error) {
            console.warn(`Error testing image ${imageNumber}:`, error);
          }
          return null;
        })
      );
      
      results.forEach(result => {
        if (result) images.push(result);
      });
    }
    
    console.log(`✅ Successfully loaded ${images.length} out of ${range.max} possible images`);
    return images;
    
  } catch (error) {
    console.error('Error in smart range detection, falling back to sequential discovery:', error);
    return discoverAvailableImages(500);
  }
};

// Get all images with smart caching (avoid loading all at once)
export const getAllImages = async (maxCount: number = 2000): Promise<ImageKitImage[]> => {
  // For large sets, return a reasonable subset
  return discoverAvailableImages(maxCount);
};

// Get images from a specific range (if you know the exact range)
export const getAllImagesInRange = async (startNum: number, endNum: number): Promise<ImageKitImage[]> => {
  console.log(`🎯 Loading images from ${startNum} to ${endNum}...`);
  
  const images: ImageKitImage[] = [];
  const batchSize = 15; // Increased batch size for better performance
  
  for (let i = startNum; i <= endNum; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && (i + j) <= endNum; j++) {
      const imageNumber = i + j;
      const imagePath = getImageKitPath(imageNumber);
      batch.push({ imageNumber, imagePath });
    }
    
    const results = await Promise.all(
      batch.map(async ({ imageNumber, imagePath }) => {
        try {
          const exists = await Promise.race([
            testImageExists(imagePath),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1200)) // Slightly longer timeout for large ranges
          ]);
          
          if (exists) {
            const metadata = await getImageMetadata(imagePath);
            return {
              id: `image-${imageNumber}`,
              title: imageNumber.toString(),
              src: `${IMAGEKIT_URL_ENDPOINT}${imagePath}?tr=q-95,f-auto`,
              ratio: metadata.ratio,
              category: 'Imaginalab AI',
              loaded: false
            };
          }
        } catch (error) {
          console.warn(`Error testing image ${imageNumber}:`, error);
        }
        return null;
      })
    );
    
    results.forEach(result => {
      if (result) images.push(result);
    });
    
    // Progress logging for large ranges
    if ((i - startNum + batchSize) % 100 === 0 || i + batchSize > endNum) {
      console.log(`📊 Progress: ${Math.min(i + batchSize - startNum, endNum - startNum + 1)} / ${endNum - startNum + 1} checked, ${images.length} found`);
    }
  }
  
  console.log(`✅ Loaded ${images.length} images from range ${startNum}-${endNum}`);
  return images;
};

// Quick estimation for very large datasets (sample-based)
export const getEstimatedImageCount = async (): Promise<number> => {
  console.log('📊 Estimating total image count with sampling...');
  
  // Sample every 50th image up to 2000 to get a quick estimate
  const sampleInterval = 50;
  let maxFound = 0;
  let consecutiveGaps = 0;
  
  for (let i = sampleInterval; i <= 2000; i += sampleInterval) {
    const imagePath = getImageKitPath(i);
    const exists = await Promise.race([
      testImageExists(imagePath),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 800))
    ]);
    
    if (exists) {
      maxFound = i;
      consecutiveGaps = 0;
      console.log(`✅ Sample found at ${i}`);
    } else {
      consecutiveGaps++;
      if (consecutiveGaps >= 3) { // Stop after 3 consecutive missing samples
        console.log(`🔍 Stopping sampling at ${i}, last found: ${maxFound}`);
        break;
      }
    }
  }
  
  // Estimate total based on highest sample found
  const estimate = maxFound + (sampleInterval * 2); // Add buffer
  console.log(`📈 Estimated ~${estimate} images based on sampling`);
  return estimate;
};

// ImageKit configuration - loaded from environment variables
export const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
export const IMAGEKIT_PATH_PREFIX = import.meta.env.VITE_IMAGEKIT_PATH_PREFIX || '/AP/';

// Validate environment variables
if (!IMAGEKIT_URL_ENDPOINT) {
  console.error('⚠️  VITE_IMAGEKIT_URL_ENDPOINT is not defined in environment variables');
}

// Global image cache to persist during page refresh
const IMAGE_CACHE_KEY = 'imagekit_cache_v1';

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

// Generate ImageKit image path
const getImageKitPath = (imageNumber: number): string => {
  return `${IMAGEKIT_PATH_PREFIX}${imageNumber}.jpg`;
};

// Preload image function for ImageKit
export const preloadImageKit = (imagePath: string): Promise<boolean> => {
  return new Promise(resolve => {
    if (imageCache.get(imagePath)) {
      // Image already in cache, resolve immediately
      resolve(true);
      return;
    }
    
    const img = new Image();
    
    const onLoad = () => {
      imageCache.set(imagePath, true);
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
    img.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
    
    // For already cached images by the browser
    if (img.complete) {
      onLoad();
    }
  });
};

// Test if an image exists at the given path
const testImageExists = async (imagePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
  });
};

// Smart discovery using binary search to find actual range
export const findImageRange = async (): Promise<{min: number, max: number}> => {
  console.log('🔍 Starting range detection...');
  
  // Binary search to find the maximum image number
  let low = 1;
  let high = 1000; // Start with reasonable upper bound
  let maxFound = 0;
  
  // First, find a rough upper bound by doubling
  while (high <= 10000) { // Increased from 2000 to 10000
    console.log(`🧪 Testing image ${high}...`);
    const imagePath = getImageKitPath(high);
    const exists = await Promise.race([
      testImageExists(imagePath),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1500))
    ]);
    
    if (exists) {
      maxFound = high;
      console.log(`✅ Found image ${high}, expanding search...`);
      high *= 2; // Double the search range
    } else {
      console.log(`❌ Image ${high} not found, starting binary search...`);
      break;
    }
  }
  
  // Binary search for exact maximum
  low = maxFound;
  high = Math.min(high, 10000); // Increased cap to 10000
  
  console.log(`🎯 Binary search between ${low} and ${high}...`);
  
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    console.log(`🔍 Testing midpoint: ${mid}`);
    
    const imagePath = getImageKitPath(mid);
    const exists = await Promise.race([
      testImageExists(imagePath),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    
    if (exists) {
      low = mid;
      maxFound = mid;
      console.log(`✅ Image ${mid} exists, searching higher...`);
    } else {
      high = mid - 1;
      console.log(`❌ Image ${mid} missing, searching lower...`);
    }
  }
  
  console.log(`🏁 Final range detected: 1 to ${maxFound}`);
  return { min: 1, max: maxFound };
};

// Optimized discovery for large image sets (500+ images) - SMART VERSION
export const discoverAvailableImages = async (limit: number = 10): Promise<ImageKitImage[]> => {
  const images: ImageKitImage[] = [];
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 20; // Allow more gaps in image sequence
  
  // Very aggressive optimization - test images individually for speed
  for (let i = 1; i <= limit && consecutiveFailures < maxConsecutiveFailures; i++) {
    const imageNumber = i;
    const imagePath = getImageKitPath(imageNumber);
    
    try {
      // Much faster test with shorter timeout
      const exists = await Promise.race([
        testImageExists(imagePath),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 800)) // 800ms timeout
      ]);
      
      if (exists) {
        // Get real metadata for proper aspect ratio
        const metadata = await getImageMetadata(imagePath);
        images.push({
          id: `image-${imageNumber}`,
          title: imageNumber.toString(),
          src: `${IMAGEKIT_URL_ENDPOINT}${imagePath}?tr=q-95,f-auto`, // Increased quality
          ratio: metadata.ratio, // Use real ratio instead of default
          category: 'Imaginalab AI',
          loaded: false
        });
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
      }
    } catch (error) {
      console.warn(`Error testing image ${imageNumber}:`, error);
      consecutiveFailures++;
    }
  }
  
  console.log(`Fast discovery: ${images.length} images (limit: ${limit})`);
  return images;
};

// Enhanced image data structure with metadata extraction
const getImageMetadata = async (imagePath: string): Promise<{ title: string; ratio: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const aspectRatio = ratio > 1 ? '3:2' : '2:3';
      
      // Extract filename without extension for title
      const filename = imagePath.split('/').pop()?.replace('.jpg', '').replace('.jpeg', '').replace('.png', '') || 'Unknown';
      
      resolve({
        title: filename,
        ratio: aspectRatio
      });
    };
    img.onerror = () => resolve({
      title: 'Unknown Image',
      ratio: '2:3'
    });
    img.src = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
  });
};

// Progressive discovery for large image sets
export const discoverImagesProgressively = async (startIndex: number, count: number): Promise<ImageKitImage[]> => {
  const images: ImageKitImage[] = [];
  const endIndex = startIndex + count;
  
  // Test images in small batches
  const batchSize = 3;
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && (i + j) < endIndex; j++) {
      const imageNumber = i + j + 1; // Images start from 1
      const imagePath = getImageKitPath(imageNumber);
      batch.push({ imageNumber, imagePath });
    }
    
    const results = await Promise.all(
      batch.map(async ({ imageNumber, imagePath }) => {
        try {
          const exists = await Promise.race([
            testImageExists(imagePath),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1500))
          ]);
          
          if (exists) {
            return {
              id: `image-${imageNumber}`,
              title: imageNumber.toString(),
              src: `${IMAGEKIT_URL_ENDPOINT}${imagePath}?tr=q-80,f-auto,w-400`,
              ratio: '2:3',
              category: 'Imaginalab AI',
              loaded: false
            };
          }
        } catch (error) {
          console.warn(`Error testing image ${imageNumber}:`, error);
        }
        return null;
      })
    );
    
    results.forEach(result => {
      if (result) images.push(result);
    });
  }
  
  return images;
};

// Create a smaller subset of initial images for ULTRA FAST loading
export const getInitialImages = async (count = 5): Promise<ImageKitImage[]> => {
  return discoverAvailableImages(Math.min(count, 5)); // Cap at 5 for speed
};

// Load images in batches with progressive discovery
export const getImageBatch = async (startIndex: number, count: number): Promise<ImageKitImage[]> => {
  return discoverImagesProgressively(startIndex, count);
};

// NEW: Get ALL images for "Show All" functionality (up to 500)
export const getAllImagesComplete = async (): Promise<ImageKitImage[]> => {
  const images: ImageKitImage[] = [];
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 10; // Allow more gaps for complete discovery
  
  // Batch processing for better performance
  const batchSize = 5;
  for (let i = 1; i <= 500 && consecutiveFailures < maxConsecutiveFailures; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && (i + j) <= 500; j++) {
      const imageNumber = i + j;
      const imagePath = getImageKitPath(imageNumber);
      batch.push({ imageNumber, imagePath });
    }
    
    const results = await Promise.all(
      batch.map(async ({ imageNumber, imagePath }) => {
        try {
          const exists = await Promise.race([
            testImageExists(imagePath),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000))
          ]);
          
          if (exists) {
            const metadata = await getImageMetadata(imagePath);
            return {
              id: `image-${imageNumber}`,
              title: imageNumber.toString(),
              src: `${IMAGEKIT_URL_ENDPOINT}${imagePath}?tr=q-95,f-auto`,
              ratio: metadata.ratio,
              category: 'Imaginalab AI',
              loaded: false
            };
          }
        } catch (error) {
          console.warn(`Error testing image ${imageNumber}:`, error);
        }
        return null;
      })
    );
    
    let batchHasImages = false;
    for (const result of results) {
      if (result) {
        images.push(result);
        batchHasImages = true;
      }
    }
    
    if (!batchHasImages) {
      consecutiveFailures++;
    } else {
      consecutiveFailures = 0;
    }
  }
  
  console.log(`Complete discovery: ${images.length} total images found`);
  return images;
};

// Enhanced function to get image with proper metadata
export const getImageWithRatio = async (imagePath: string): Promise<ImageKitImage> => {
  const metadata = await getImageMetadata(imagePath);
  const imageNumber = imagePath.match(/\d+/)?.[0] || '1';
  
  return {
    id: `image-${imageNumber}`,
    title: metadata.title,
    src: `${IMAGEKIT_URL_ENDPOINT}${imagePath}?tr=q-80,f-auto`, // Full URL with transformations
    ratio: metadata.ratio,
    category: 'Imaginalab AI',
    loaded: imageCache.get(imagePath) || false
  };
};

// Mark an image as loaded in the cache
export const markImageLoaded = (imagePath: string): void => {
  imageCache.set(imagePath, true);
  saveCache();
};

// Check if an image is already loaded/cached
export const isImageLoaded = (imagePath: string): boolean => {
  return imageCache.get(imagePath) || false;
};

// Reset the image cache (useful for debugging)
export const resetImageCache = (): void => {
  imageCache.clear();
  saveCache();
};

export const getImageById = async (id: string): Promise<ImageKitImage | undefined> => {
  // Extract image number from ID
  const imageNumber = parseInt(id.replace('image-', ''));
  if (isNaN(imageNumber)) return undefined;
  
  const imagePath = getImageKitPath(imageNumber);
  const exists = await testImageExists(imagePath);
  
  if (exists) {
    return {
      id,
      title: imageNumber.toString(),
      src: `${IMAGEKIT_URL_ENDPOINT}${imagePath}?tr=q-80,f-auto`,
      ratio: '2:3',
      category: 'Imaginalab AI',
      loaded: isImageLoaded(imagePath)
    };
  }
  
  return undefined;
};

// Get total count estimation (avoid checking all 500+ images)
export const getTotalImageCount = async (): Promise<number> => {
  // Quick estimation by checking every 10th image up to 500
  let maxFound = 0;
  for (let i = 10; i <= 500; i += 10) {
    const imagePath = getImageKitPath(i);
    const exists = await testImageExists(imagePath);
    if (exists) {
      maxFound = i;
    } else if (i - maxFound > 50) {
      // If we haven't found an image in 50 iterations, likely near the end
      break;
    }
  }
  
  // Estimate total based on the last found image
  return Math.min(maxFound + 20, 500); // Add buffer but cap at 500
};

// Force preload a specific image and return it when loaded
export const getPreloadedImage = async (index: number): Promise<ImageKitImage | null> => {
  const imageNumber = index + 1; // Convert 0-based index to 1-based
  const imagePath = getImageKitPath(imageNumber);
  
  const exists = await testImageExists(imagePath);
  if (!exists) return null;
  
  const fullImageUrl = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
  await preloadImageKit(imagePath);
  
  return {
    id: `image-${imageNumber}`,
    title: imageNumber.toString(),
    src: `${fullImageUrl}?tr=q-80,f-auto`,
    ratio: '2:3',
    category: 'Imaginalab AI',
    loaded: true
  };
};
