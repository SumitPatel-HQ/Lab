import React, { useState } from 'react';
import { Image as IKImage } from '@imagekit/react';
import { type ImageKitImage as ImageType, IMAGEKIT_URL_ENDPOINT } from '../services/imageKitService';

interface CardProps {
  image: ImageType;
  index: number;
  activeIndex: number;
  totalImages: number;
  isDragging?: boolean;
  isMobile?: boolean;
}

const Card: React.FC<CardProps> = React.memo(({ 
  image, 
  index, 
  activeIndex, 
  totalImages, 
  isDragging = false, 
  isMobile = false 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);

  // Calculate position and rotation based on index relative to active index
  const getCardStyle = () => {
    const diff = index - activeIndex;
    const isActive = diff === 0;
    const isPrev = diff === -1 || (activeIndex === 0 && index === totalImages - 1);
    const isNext = diff === 1 || (activeIndex === totalImages - 1 && index === 0);
    
    // Base styles
    let transform = '';
    let zIndex = 0;
    let opacity = 0;
    
    if (isActive) {
      transform = 'translate(-50%, -50%)';
      zIndex = 30;
      opacity = 1;
    } else if (isPrev) {
      if (isMobile && isDragging) {
        transform = 'translate(-60%, -50%) scale(0.9)';
      } else {
        transform = 'translate(-60%, -50%) rotate(-10deg) scale(0.9)';
      }
      zIndex = 20;
      opacity = 0.7;
    } else if (isNext) {
      if (isMobile && isDragging) {
        transform = 'translate(-40%, -50%) scale(0.9)';
      } else {
        transform = 'translate(-40%, -50%) rotate(10deg) scale(0.9)';
      }
      zIndex = 20;
      opacity = 0.7;
    } else if (diff < -1 || (activeIndex >= totalImages - 2 && index < activeIndex - 1)) {
      transform = isMobile ? 'translate(-70%, -50%) scale(0.8)' : 'translate(-70%, -50%) rotate(-20deg) scale(0.8)';
      zIndex = 10;
      opacity = 0.5;
    } else if (diff > 1 || (activeIndex <= 1 && index > activeIndex + 1)) {
      transform = isMobile ? 'translate(-30%, -50%) scale(0.8)' : 'translate(-30%, -50%) rotate(20deg) scale(0.8)';
      zIndex = 10;
      opacity = 0.5;
    }
    
    return {
      zIndex,
      opacity,
      transform,
    };
  };

  // Determine aspect ratio class based on the image ratio
  const getAspectRatioClass = () => {
    if (image.ratio === '3:2') {
      return 'aspect-[3/2] max-h-[60vh]';
    }
    return 'aspect-[2/3] max-h-[70vh]';
  };

  const style = getCardStyle();
  
  // Optimize transitions for mobile
  const getTransitionClass = () => {
    if (isDragging && isMobile) {
      return "";
    }
    if (isMobile) {
      return "transition-transform duration-150 ease-linear";
    }
    return "transition-all duration-300 ease-out";
  };
  
  const handleImageLoad = () => {
    setLoaded(true);
  };

  const handleImageError = () => {
    console.error(`Failed to load image: ${image.src}`);
  };

  return (
    <div 
      className={`absolute top-1/2 left-1/2 w-[80vw] max-w-sm ${getTransitionClass()}`}
      style={{
        zIndex: style.zIndex,
        opacity: style.opacity,
        transform: style.transform,
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {/* Loading placeholder */}
        {!loaded && (
          <div className={`${getAspectRatioClass()} bg-gray-200 animate-pulse flex items-center justify-center`}>
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Low-quality image placeholder */}
        <IKImage
          urlEndpoint={IMAGEKIT_URL_ENDPOINT}
          src={image.src}
          alt=""
          loading="eager"
          className={`absolute inset-0 w-full h-full object-cover blur-sm transition-opacity duration-500 ${placeholderLoaded ? 'opacity-30' : 'opacity-0'}`}
          onLoad={() => setPlaceholderLoaded(true)}
          transformation={[
            {
              quality: 10,
              width: 20,
              blur: 10,
              format: "auto"
            }
          ]}
        />

        {/* Main high-quality image */}
        <IKImage
          urlEndpoint={IMAGEKIT_URL_ENDPOINT}
          src={image.src}
          alt={image.title}
          loading={index === activeIndex ? "eager" : "lazy"}
          className={`${getAspectRatioClass()} w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity will-change-auto`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          transformation={[
            {
              quality: 100,
              format: "auto"
            }
          ]}
        />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg drop-shadow-md">{image.title}</h3>
        </div>
      </div>
    </div>
  );
});

export default Card;
