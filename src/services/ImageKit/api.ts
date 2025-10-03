// ImageKit API service for fetching files using List Files API
// This enables support for any file type and any filename (including special characters)

export const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '';
export const IMAGEKIT_PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || '';
export const IMAGEKIT_API_ENDPOINT = 'https://api.imagekit.io/v1/files';

// Validate API credentials
if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY) {
  console.warn('⚠️ ImageKit API credentials not configured. File listing may not work.');
}

// ImageKit File object from List Files API
export interface ImageKitFile {
  fileId: string;
  name: string;
  filePath: string;
  type: 'file' | 'folder' | 'file-version';
  fileType: string;
  url: string;
  thumbnail?: string;
  height?: number;
  width?: number;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

// List files parameters
export interface ListFilesParams {
  path?: string;
  searchQuery?: string;
  fileType?: 'all' | 'image' | 'non-image';
  tags?: string[];
  limit?: number;
  skip?: number;
  sort?: 'ASC_CREATED' | 'DESC_CREATED' | 'ASC_NAME' | 'DESC_NAME' | 'ASC_UPDATED' | 'DESC_UPDATED';
}

// Response from List Files API
export interface ListFilesResponse {
  files: ImageKitFile[];
  hasMore: boolean;
  skip: number;
  limit: number;
}

/**
 * Fetch files from ImageKit using List Files API
 * Supports all file types and filenames with special characters
 */
export const listImageKitFiles = async (params: ListFilesParams = {}): Promise<ListFilesResponse> => {
  const {
    path = '',
    searchQuery = '',
    fileType = 'all',
    tags = [],
    limit = 1000,
    skip = 0,
    sort = 'ASC_NAME'
  } = params;

  try {
    // Build query parameters
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      sort,
    });

    if (path) queryParams.append('path', path);
    if (searchQuery) queryParams.append('searchQuery', searchQuery);
    if (fileType !== 'all') queryParams.append('fileType', fileType);
    if (tags.length > 0) queryParams.append('tags', tags.join(','));

    // Basic Auth: username is Private Key, password is empty string
    const authString = btoa(`${IMAGEKIT_PRIVATE_KEY}:`);
    
    const url = `${IMAGEKIT_API_ENDPOINT}?${queryParams.toString()}`;
    console.log(`🔗 Calling ImageKit API: ${url.replace(IMAGEKIT_API_ENDPOINT, 'API')}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ImageKit API error (${response.status}):`, errorText);
      throw new Error(`ImageKit API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log(`📦 API Response: ${Array.isArray(data) ? data.length : 0} files`);
    
    return {
      files: Array.isArray(data) ? data : [],
      hasMore: Array.isArray(data) && data.length === limit,
      skip,
      limit,
    };
  } catch (error) {
    console.error('❌ Error fetching files from ImageKit:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};

/**
 * Fetch all files from a specific folder path
 * Handles pagination automatically
 */
export const getAllFilesFromFolder = async (folderPath: string): Promise<ImageKitFile[]> => {
  const allFiles: ImageKitFile[] = [];
  let skip = 0;
  const limit = 1000;
  let hasMore = true;

  console.log(`📂 Fetching all files from folder: ${folderPath}`);

  try {
    while (hasMore) {
      const response = await listImageKitFiles({
        path: folderPath,
        fileType: 'all',
        limit,
        skip,
        sort: 'ASC_NAME',
      });

      allFiles.push(...response.files);
      hasMore = response.hasMore;
      skip += limit;

      console.log(`📊 Fetched ${response.files.length} files (total: ${allFiles.length})`);

      // Safety break to prevent infinite loops
      if (skip > 10000) {
        console.warn('⚠️ Reached pagination limit of 10,000 files');
        break;
      }
    }

    console.log(`✅ Successfully fetched ${allFiles.length} files from ${folderPath}`);
    return allFiles;
  } catch (error) {
    console.error('❌ Error in getAllFilesFromFolder:', error);
    throw error;
  }
};

/**
 * Filter files by extension
 */
export const filterFilesByExtension = (files: ImageKitFile[], extensions: string[]): ImageKitFile[] => {
  const lowerExtensions = extensions.map(ext => ext.toLowerCase());
  return files.filter(file => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    return fileExt && lowerExtensions.includes(fileExt);
  });
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()! : '';
};

/**
 * Get filename without extension
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    parts.pop();
  }
  return parts.join('.');
};

/**
 * Check if file is an image based on extension
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif'];
  const ext = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(ext);
};

/**
 * Check if file is a video based on extension
 */
export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];
  const ext = getFileExtension(filename).toLowerCase();
  return videoExtensions.includes(ext);
};

/**
 * Get supported file types
 */
export const getSupportedFileTypes = (): { images: string[]; videos: string[]; all: string[] } => {
  const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif'];
  const videos = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];
  return {
    images,
    videos,
    all: [...images, ...videos],
  };
};
