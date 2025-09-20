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
}

export interface ImageRange {
  min: number;
  max: number;
}

export interface ImageMetadata {
  title: string;
  ratio: string;
}

export interface BatchResult {
  imageNumber: number;
  imagePath: string;
}
