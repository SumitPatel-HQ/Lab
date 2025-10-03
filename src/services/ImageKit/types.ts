// Shared TypeScript types for ImageKit services
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
  // New fields for flexible file support
  fileId?: string;
  fileName?: string; // Original filename with extension (e.g., "photo-2024.jpg", "image_001.png")
  fileType?: string; // File extension (e.g., "jpg", "png", "webp")
  filePath?: string; // Full path in ImageKit (e.g., "/AP/photo-2024.jpg")
}

export interface ImageRange {
  min: number;
  max: number;
}

export interface ImageMetadata {
  title: string;
  ratio: string;
  fileName?: string; // Preserve original filename
  fileType?: string; // Preserve file extension
}

export interface BatchResult {
  imageNumber: number;
  imagePath: string;
}
