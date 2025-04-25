import React, { useState, useEffect, useRef } from 'react';
import type { Image } from '../services/imageService';

interface ImageCardProps {
  image: Image;
  index: number;
  activeIndex: number;
  totalImages: number;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, index, activeIndex, totalImages }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Improved visibility logic to preload more images
  const isVisible = Math.abs(index - activeIndex) <= 3 || 
                   (activeIndex < 3 && index > totalImages - 4) ||
                   (activeIndex > totalImages - 4 && index < 3);

  useEffect(() => {
    // Reset loaded state when image changes
    setLoaded(false);
    setError(false);
    
    if (!isVisible) return;
    
    const img = new Image();
    img.src = image.src;
    
    img.onload = () => {
      setLoaded(true);
    };
    
    img.onerror = () => {
      setError(true);
      setLoaded(true); // Mark as loaded to remove spinner
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [image.src, isVisible]);

  // Calculate position and rotation based on index relative to active index
  const getCardStyle = () => {
    // Handle wrap-around cases for smooth carousel effect
    let diff = index - activeIndex;
    
    // Handle wrap-around cases for smooth circular navigation
    if (diff > totalImages / 2) diff -= totalImages;
    if (diff < -totalImages / 2) diff += totalImages;
    
    const isActive = diff === 0;
    const isPrev = diff === -1;
    const isNext = diff === 1;
    
    // Base styles
    let transform = '';
    let zIndex = 0;
    let opacity = 0;
    
    if (isActive) {
      transform = 'translate(-50%, -50%) rotate(0deg) scale(1)';
      zIndex = 30;
      opacity = 1;
    } else if (isPrev) {
      transform = 'translate(-60%, -50%) rotate(-10deg) scale(0.9)';
      zIndex = 20;
      opacity = 0.7;
    } else if (isNext) {
      transform = 'translate(-40%, -50%) rotate(10deg) scale(0.9)';
      zIndex = 20;
      opacity = 0.7;
    } else if (diff < -1) {
      transform = 'translate(-70%, -50%) rotate(-20deg) scale(0.8)';
      zIndex = 10;
      opacity = 0.5;
    } else if (diff > 1) {
      transform = 'translate(-30%, -50%) rotate(20deg) scale(0.8)';
      zIndex = 10;
      opacity = 0.5;
    }
    
    return {
      zIndex,
      opacity,
      transform,
    };
  };

  // Determine aspect ratio class
  const getAspectRatioClass = () => {
    return image.ratio === '2:3' 
      ? 'aspect-[2/3] max-h-[87vh]' 
      : 'aspect-[3/2] max-h-[78vh]';
  };

  const style = getCardStyle();

  // If the card is far from the active index and not visible, don't render it
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="absolute top-1/2 left-1/2 w-[80vw] max-w-sm transition-all duration-700 ease-in-out will-change-transform"
      style={{
        zIndex: style.zIndex,
        opacity: style.opacity,
        transform: style.transform,
        transitionProperty: 'transform, opacity',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {!loaded && (
          <div className={`${getAspectRatioClass()} bg-gray-200 animate-pulse flex items-center justify-center`}>
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error ? (
          <div className={`${getAspectRatioClass()} bg-gray-800 flex flex-col items-center justify-center p-4`}>
            <div className="text-red-400 mb-2">⚠️</div>
            <p className="text-white text-center text-sm">Failed to load image</p>
          </div>
        ) : (
          <img 
            ref={imgRef}
            src={image.src} 
            alt={image.title}
            loading="lazy"
            className={`${getAspectRatioClass()} w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg drop-shadow-md">{image.title}</h3>
          <p className="text-white/90 text-sm">{image.category}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;