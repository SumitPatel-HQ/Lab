import React, { useState } from 'react';
import { Image as IKImage } from '@imagekit/react';
import { type ImageKitImage as ImageType, IMAGEKIT_URL_ENDPOINT } from '../../services/ImageKit';
import { Skeleton } from '../ui/Skeleton';

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
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Calculate position and rotation based on index relative to active index (same as original Card)
  const getCardStyle = () => {
    const diff = index - activeIndex;
    const isActive = diff === 0;
    const isPrev = diff === -1 || (activeIndex === 0 && index === totalImages - 1);
    const isNext = diff === 1 || (activeIndex === totalImages - 1 && index === 0);
    
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
    } else {
      opacity = 0;
      zIndex = 10;
      transform = 'translate(-50%, -50%) scale(0.8)';
    }

    return {
      transform,
      zIndex,
      opacity,
      transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  const handleMainImageLoad = () => {
    setLoaded(true);
    setTimeout(() => setShowSkeleton(false), 100);
  };

  const getAspectRatioClass = () => image.ratio === '2:3' ? 'aspect-[2/3]' : 'aspect-[3/2]';

  return (
    <div 
      className="absolute left-1/2 top-1/2 will-change-transform" 
      style={{
        ...getCardStyle(),
        pointerEvents: index === activeIndex ? 'auto' : 'none'
      }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {/* Skeleton placeholder */}
        {showSkeleton && (
          <div className={`${getAspectRatioClass()} w-[85vw] sm:w-[70vw] md:w-[50vw] lg:w-[40vw] max-w-xl bg-gray-800 relative`}>
            <Skeleton 
              className="absolute inset-0 w-full h-full" 
              shimmer 
              variant="rounded"
            />
          </div>
        )}

        {/* Low-quality image placeholder */}
        <IKImage
          urlEndpoint={IMAGEKIT_URL_ENDPOINT}
          src={image.src}
          alt=""
          loading="eager"
          className={`absolute inset-0 w-full h-full object-cover blur-sm transition-opacity duration-500 ${
            placeholderLoaded ? 'opacity-30' : 'opacity-0'
          } ${showSkeleton ? 'invisible' : 'visible'}`}
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
          alt={image.title || "Gallery Image"}
          loading="eager"
          //here is main home page view port
          className={`w-[80vw] sm:w-[70vw] md:w-[50vw] lg:w-[40vw] max-w-lg ${getAspectRatioClass()} object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${showSkeleton ? 'invisible' : 'visible'}`}
          onLoad={handleMainImageLoad}
          transformation={[
            {
              quality: 90,
              format: "auto",
              progressive: true
            }
          ]}
        />
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default Card;