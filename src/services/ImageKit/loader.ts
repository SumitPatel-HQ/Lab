// Image loading and metadata management
import type { ImageKitImage, ImageMetadata, BatchResult } from './types';
import { CONFIG, IMAGEKIT_URL_ENDPOINT, getImageKitPath, testImageExists, createImageTransformations, getOptimizedImageUrl, getDeviceType, getOptimalQuality } from './config';
import { isImageLoaded, preloadImageKit } from './cache';
import { getAllFilesFromFolder, getFileExtension, getFileNameWithoutExtension } from './api';

// Enhanced image metadata extraction using optimized thumbnail
// Now supports any file extension and preserves original filenames
export const getImageMetadata = async (imagePath: string, fileName?: string): Promise<ImageMetadata> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      // Improved aspect ratio detection with cleaner logic
      // 3:2 = 1.5, 2:3 = 0.67, so use 1.0 as the clear threshold
      const aspectRatio = ratio >= 1.5 ? '3:2' : '2:3';
      
      // Preserve original filename if provided, otherwise extract from path
      const originalFileName = fileName || imagePath.split('/').pop() || 'Unknown';
      const fileExt = getFileExtension(originalFileName);
      const fileNameOnly = getFileNameWithoutExtension(originalFileName);
      
      resolve({
        title: fileNameOnly,
        ratio: aspectRatio,
        fileName: originalFileName,
        fileType: fileExt
      });
    };
    img.onerror = () => {
      console.warn(`❌ Failed to load metadata for ${imagePath}`);
      const originalFileName = fileName || imagePath.split('/').pop() || 'Unknown';
      const fileExt = getFileExtension(originalFileName);
      const fileNameOnly = getFileNameWithoutExtension(originalFileName);
      
      resolve({
        title: fileNameOnly,
        ratio: '2:3',
        fileName: originalFileName,
        fileType: fileExt
      });
    };
    // Use ultra-fast tiny image for metadata detection
    img.src = getOptimizedImageUrl(imagePath, createImageTransformations.placeholder(30));
  });
};

// NEW: API-based discovery - Fetch all files from ImageKit using List Files API
// This supports any file type and any filename (including special characters)
export const discoverAllFilesFromAPI = async (): Promise<ImageKitImage[]> => {
  console.log('🚀 Using ImageKit API to discover all files...');
  
  try {
    const folderPath = import.meta.env.VITE_IMAGEKIT_PATH_PREFIX || '/AP/';
    console.log(`📂 Fetching files from: ${folderPath}`);
    
    const files = await getAllFilesFromFolder(folderPath);
    console.log(`✅ Found ${files.length} files from ImageKit API`);
    
    if (files.length === 0) {
      console.warn('⚠️ No files found in the specified folder. Check your VITE_IMAGEKIT_PATH_PREFIX.');
      return [];
    }
    
    // Convert ImageKit files to ImageKitImage format
    const images: ImageKitImage[] = [];
    
    for (const file of files) {
      try {
        // Use file dimensions from API if available, otherwise default
        const ratio = (file.width && file.height) 
          ? (file.width / file.height >= 1.5 ? '3:2' : '2:3')
          : '2:3'; // Default ratio
        
        // IMPORTANT: Use file.url (properly encoded) instead of building from filePath
        // The API returns a properly encoded URL that handles spaces and special characters
        images.push({
          id: file.fileId,
          title: getFileNameWithoutExtension(file.name),
          src: file.url, // Use the URL from API directly (already properly encoded)
          ratio: ratio,
          category: 'Imaginalab AI',
          loaded: false,
          fileId: file.fileId,
          fileName: file.name,
          fileType: getFileExtension(file.name),
          filePath: file.filePath,
          width: file.width,
          height: file.height,
        });
      } catch (error) {
        console.warn(`⚠️ Error processing file ${file.name}:`, error);
      }
    }
    
    console.log(`✅ Successfully processed ${images.length} images from API`);
    return images;
  } catch (error) {
    console.error('❌ Error discovering files from API:', error);
    console.log('⚠️ Falling back to legacy numeric discovery...');
    // Fallback to old method if API fails
    return discoverAvailableImages(100);
  }
};

// Optimized discovery for large image sets (LEGACY - uses numeric guessing)
export const discoverAvailableImages = async (limit: number = 10): Promise<ImageKitImage[]> => {
  const images: ImageKitImage[] = [];
  let consecutiveFailures = 0;
  
  for (let i = 1; i <= limit && consecutiveFailures < CONFIG.MAX_CONSECUTIVE_FAILURES; i++) {
    const imageNumber = i;
    const imagePath = getImageKitPath(imageNumber);
    
    try {
      const exists = await Promise.race([
        testImageExists(imagePath),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 800))
      ]);
      
      if (exists) {
        const metadata = await getImageMetadata(imagePath);
        const deviceType = getDeviceType();
        images.push({
          id: `image-${imageNumber}`,
          title: 'ImaginaLab',
          src: getOptimizedImageUrl(imagePath, getOptimalQuality('thumbnail', deviceType)),
          ratio: metadata.ratio,
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

// Get images from a specific range
export const getAllImagesInRange = async (startNum: number, endNum: number): Promise<ImageKitImage[]> => {
  console.log(`🎯 Loading images from ${startNum} to ${endNum}...`);
  
  const images: ImageKitImage[] = [];
  
  for (let i = startNum; i <= endNum; i += CONFIG.DEFAULT_BATCH_SIZE) {
    const batch: BatchResult[] = [];
    for (let j = 0; j < CONFIG.DEFAULT_BATCH_SIZE && (i + j) <= endNum; j++) {
      const imageNumber = i + j;
      const imagePath = getImageKitPath(imageNumber);
      batch.push({ imageNumber, imagePath });
    }
    
    const results = await Promise.all(
      batch.map(async ({ imageNumber, imagePath }) => {
        try {
          const exists = await Promise.race([
            testImageExists(imagePath),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), CONFIG.DEFAULT_TIMEOUT))
          ]);
          
          if (exists) {
            const metadata = await getImageMetadata(imagePath);
            const deviceType = getDeviceType();
            return {
              id: `image-${imageNumber}`,
              title: 'ImaginaLab',
              src: getOptimizedImageUrl(imagePath, getOptimalQuality('thumbnail', deviceType)),
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
    if ((i - startNum + CONFIG.DEFAULT_BATCH_SIZE) % 100 === 0 || i + CONFIG.DEFAULT_BATCH_SIZE > endNum) {
      console.log(`📊 Progress: ${Math.min(i + CONFIG.DEFAULT_BATCH_SIZE - startNum, endNum - startNum + 1)} / ${endNum - startNum + 1} checked, ${images.length} found`);
    }
  }
  
  console.log(`✅ Loaded ${images.length} images from range ${startNum}-${endNum}`);
  return images;
};

// Progressive discovery for large image sets
export const discoverImagesProgressively = async (startIndex: number, count: number): Promise<ImageKitImage[]> => {
  const images: ImageKitImage[] = [];
  const endIndex = startIndex + count;
  const batchSize = 3;
  
  for (let i = startIndex; i < endIndex; i += batchSize) {
    const batch: BatchResult[] = [];
    for (let j = 0; j < batchSize && (i + j) < endIndex; j++) {
      const imageNumber = i + j + 1;
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
            const metadata = await getImageMetadata(imagePath);
            return {
              id: `image-${imageNumber}`,
              title: 'ImaginaLab',
              src: getOptimizedImageUrl(imagePath, createImageTransformations.thumbnail(400)),
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
  
  return images;
};

// Force preload a specific image
export const getPreloadedImage = async (index: number): Promise<ImageKitImage | null> => {
  const imageNumber = index + 1;
  const imagePath = getImageKitPath(imageNumber);
  
  const exists = await testImageExists(imagePath);
  if (!exists) return null;
  
  const fullImageUrl = `${IMAGEKIT_URL_ENDPOINT}${imagePath}`;
  await preloadImageKit(imagePath);
  const metadata = await getImageMetadata(imagePath);
  
  return {
    id: `image-${imageNumber}`,
    title: 'ImaginaLab',
    src: getOptimizedImageUrl(fullImageUrl.replace(IMAGEKIT_URL_ENDPOINT, ''), createImageTransformations.preview(800)),
    ratio: metadata.ratio,
    category: 'Imaginalab AI',
    loaded: true
  };
};

// Get image by ID
export const getImageById = async (id: string): Promise<ImageKitImage | undefined> => {
  const imageNumber = parseInt(id.replace('image-', ''));
  if (isNaN(imageNumber)) return undefined;
  
  const imagePath = getImageKitPath(imageNumber);
  const exists = await testImageExists(imagePath);
  
  if (exists) {
    const metadata = await getImageMetadata(imagePath);
    return {
      id,
      title: 'ImaginaLab',
      src: getOptimizedImageUrl(imagePath, createImageTransformations.preview(600)),
      ratio: metadata.ratio,
      category: 'Imaginalab AI',
      loaded: isImageLoaded(imagePath)
    };
  }
  
  return undefined;
};

// Enhanced function to get image with proper metadata
export const getImageWithRatio = async (imagePath: string): Promise<ImageKitImage> => {
  const metadata = await getImageMetadata(imagePath);
  const imageNumber = imagePath.match(/\d+/)?.[0] || '1';
  
  return {
    id: `image-${imageNumber}`,
    title: metadata.title,
    src: getOptimizedImageUrl(imagePath, createImageTransformations.preview(700)),
    ratio: metadata.ratio,
    category: 'Imaginalab AI',
    loaded: isImageLoaded(imagePath) || false
  };
};
