import React, { useState } from 'react';
import { Skeleton } from '../ui/Skeleton';
import type { ImageKitImage as Image } from '../../services/ImageKit';

interface ImageSkeletonProps {
  image: Image;
  className?: string;
  onImageLoad?: () => void;
  aspectRatio?: '2:3' | '3:2';
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  image,
  className = '',
  onImageLoad,
  aspectRatio = '2:3'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const handleImageLoad = () => {
    setIsLoaded(true);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setShowSkeleton(false);
      onImageLoad?.();
    }, 100);
  };

  const handleImageError = () => {
    setShowSkeleton(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Skeleton placeholder */}
      {showSkeleton && (
        <div className={`${aspectRatio === '2:3' ? 'pb-[150%]' : 'pb-[66.67%]'} bg-gray-800 relative`}>
          <Skeleton 
            className="absolute inset-0 w-full h-full" 
            shimmer 
            variant="square"
          />
        </div>
      )}
      
      {/* Actual image */}
      <img 
        className={`${showSkeleton ? 'absolute inset-0' : ''} w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        src={image.src}
        alt={image.title}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          display: showSkeleton ? 'block' : 'block'
        }}
      />
    </div>
  );
};

export default ImageSkeleton;