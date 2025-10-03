// Image discovery algorithms
import type { ImageRange } from './types';
import { CONFIG, getImageKitPath, testImageExists } from './config';
import { getAllFilesFromFolder } from './api';

// NEW: API-based range detection - Get actual file count from ImageKit API
export const findImageRangeFromAPI = async (): Promise<ImageRange> => {
  console.log('🔍 Using ImageKit API for range detection...');
  
  try {
    const files = await getAllFilesFromFolder(import.meta.env.VITE_IMAGEKIT_PATH_PREFIX || '/AP/');
    console.log(`✅ Found ${files.length} files from ImageKit API`);
    
    return {
      min: 1,
      max: files.length
    };
  } catch (error) {
    console.error('❌ Error in API-based range detection:', error);
    console.log('⚠️ Falling back to legacy binary search...');
    return findImageRange();
  }
};

// Smart discovery using binary search to find actual range (LEGACY)
export const findImageRange = async (): Promise<ImageRange> => {
  console.log('🔍 Starting range detection...');
  
  let low = 1;
  let high = 1000;
  let maxFound = 0;
  
  // Find rough upper bound by doubling
  while (high <= CONFIG.MAX_RANGE) {
    console.log(`🧪 Testing image ${high}...`);
    const imagePath = getImageKitPath(high);
    const exists = await Promise.race([
      testImageExists(imagePath),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1500))
    ]);
    
    if (exists) {
      maxFound = high;
      console.log(`✅ Found image ${high}, expanding search...`);
      high *= 2;
    } else {
      console.log(`❌ Image ${high} not found, starting binary search...`);
      break;
    }
  }
  
  // Binary search for exact maximum
  low = maxFound;
  high = Math.min(high, CONFIG.MAX_RANGE);
  
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

// Quick estimation for very large datasets (sample-based)
export const getEstimatedImageCount = async (): Promise<number> => {
  console.log('📊 Estimating total image count with sampling...');
  
  let maxFound = 0;
  let consecutiveGaps = 0;
  
  for (let i = CONFIG.SAMPLE_INTERVAL; i <= 2000; i += CONFIG.SAMPLE_INTERVAL) {
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
      if (consecutiveGaps >= 3) {
        console.log(`🔍 Stopping sampling at ${i}, last found: ${maxFound}`);
        break;
      }
    }
  }
  
  const estimate = maxFound + (CONFIG.SAMPLE_INTERVAL * 2);
  console.log(`📈 Estimated ~${estimate} images based on sampling`);
  return estimate;
};

// Get total count estimation (legacy function)
export const getTotalImageCount = async (): Promise<number> => {
  let maxFound = 0;
  for (let i = 10; i <= 500; i += 10) {
    const imagePath = getImageKitPath(i);
    const exists = await testImageExists(imagePath);
    if (exists) {
      maxFound = i;
    } else if (i - maxFound > 50) {
      break;
    }
  }
  
  return Math.min(maxFound + 20, 500);
};
