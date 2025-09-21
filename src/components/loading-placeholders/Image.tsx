import React, { useState } from 'react';
import { Skeleton } from '../ui/Skeleton';
import type { ImageKitImage as Image } from '../../services/ImageKit';
import { createImageTransformations, getOptimizedImageUrl, getDeviceType, getOptimalQuality } from '../../services/ImageKit/config';

interface ImageSkeletonProps {
  image: Image;
  className?: string;
  onImageLoad?: () => void;
  aspectRatio?: '2:3' | '3:2';
  quality?: 'thumbnail' | 'preview' | 'full'; // Quality level
  fetchPriority?: 'high' | 'low' | 'auto'; // Browser fetch priority
  loading?: 'eager' | 'lazy'; // Loading behavior
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  image,
  className = '',
  onImageLoad,
  aspectRatio = '2:3',
  quality = 'thumbnail',
  fetchPriority = 'auto',
  loading = 'lazy'
}) => {
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Get original image path from the image src
  const imagePath = image.src.split('?')[0].replace(import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '', '');
  
  // Generate different quality URLs
  const placeholderUrl = getOptimizedImageUrl(imagePath, createImageTransformations.placeholder(30));
  
  const getMainImageUrl = () => {
    const deviceType = getDeviceType();
    switch (quality) {
      case 'thumbnail':
        // Use smart quality selection for thumbnails
        return getOptimizedImageUrl(imagePath, getOptimalQuality('thumbnail', deviceType));
      case 'preview':
        // Use smart quality selection for previews
        return getOptimizedImageUrl(imagePath, getOptimalQuality('preview', deviceType));
      case 'full':
        // Use smart quality selection for full size
        return getOptimizedImageUrl(imagePath, getOptimalQuality('fullSize', deviceType));
      default:
        // Default to responsive high quality
        return getOptimizedImageUrl(imagePath, createImageTransformations.responsive(deviceType));
    }
  };

  const mainImageUrl = getMainImageUrl();

  const handlePlaceholderLoad = () => {
    setPlaceholderLoaded(true);
  };

  const handleMainImageLoad = () => {
    setMainImageLoaded(true);
    setTimeout(() => {
      setShowSkeleton(false);
      onImageLoad?.();
    }, 150);
  };

  const handleImageError = () => {
    setShowSkeleton(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Skeleton placeholder - maintains aspect ratio */}
      {showSkeleton && (
        <div className={`${aspectRatio === '2:3' ? 'aspect-[2/3]' : 'aspect-[3/2]'} bg-gray-800 relative`}>
          <Skeleton 
            className="absolute inset-0 w-full h-full" 
            shimmer 
            variant="square"
          />
        </div>
      )}
      
      {/* Image container for proper aspect ratio */}
      <div className={`${showSkeleton ? 'absolute inset-0' : `${aspectRatio === '2:3' ? 'aspect-[2/3]' : 'aspect-[3/2]'}`} relative`}>
        {/* Low-quality placeholder */}
        <img 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            placeholderLoaded && !mainImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          src={placeholderUrl}
          alt=""
          loading={loading}
          fetchPriority={fetchPriority}
          onLoad={handlePlaceholderLoad}
          onError={handleImageError}
          style={{ filter: 'blur(10px)' }}
        />
        
        {/* Main image */}
        <img 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            mainImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          src={mainImageUrl}
          alt={image.title}
          loading={loading}
          fetchPriority={fetchPriority}
          onLoad={handleMainImageLoad}
          onError={handleImageError}
        />
      </div>
    </div>
  );
};

export default ImageSkeleton;