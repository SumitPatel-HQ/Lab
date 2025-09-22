import React, { useRef } from 'react';
import type { ImageKitImage as Image } from '../../services/ImageKit';
import { getImageKitUrl, getPlaceholderUrl, getResponsiveSrcSet } from './constants';
import { LoadingStates } from './LoadingStates';
import { ImageTitle } from './ImageTitle';
import { SwipeIndicators } from './SwipeIndicators';
import type { ImageLoadingState } from '../../hooks/useImageState';
import type { SwipeState } from '../../hooks/useGestures';

interface ImageContainerProps {
  image: Image;
  loadingState: ImageLoadingState;
  swipeState: SwipeState;
  imageTransform: string;
  imageTransition: string;
  imageShadow: string;
  willChange: string;
  prevImage?: Image | null;
  nextImage?: Image | null;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  mouseHandlers: {
    onMouseMove: (e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onWheel: (e: React.WheelEvent) => void;
    onDoubleClick: () => void;
  };
  loadingHandlers: {
    onImageLoad: () => void;
    onImageError: () => void;
    onPlaceholderLoad: () => void;
  };
}

export const ImageContainer: React.FC<ImageContainerProps> = React.memo(({
  image,
  loadingState,
  swipeState,
  imageTransform,
  imageTransition,
  imageShadow,
  willChange,
  prevImage,
  nextImage,
  touchHandlers,
  mouseHandlers,
  loadingHandlers,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={imageContainerRef}
      className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl"
      onTouchStart={touchHandlers.onTouchStart}
      onTouchMove={touchHandlers.onTouchMove}
      onTouchEnd={touchHandlers.onTouchEnd}
      onWheel={mouseHandlers.onWheel}
      onDoubleClick={mouseHandlers.onDoubleClick}
      onMouseMove={(e) => mouseHandlers.onMouseMove(e, imageContainerRef)}
      onMouseEnter={mouseHandlers.onMouseEnter}
      onMouseLeave={mouseHandlers.onMouseLeave}
      style={{
        willChange: 'transform',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'none' // Disable all default touch behaviors
      }}
    >
      <div 
        className="w-full h-full flex items-center justify-center relative bg-black/50 rounded-xl overflow-hidden"
        style={{
          transform: imageTransform,
          transition: imageTransition,
          boxShadow: imageShadow,
          willChange,
        }}
      >
        {/* LQIP (Low Quality Image Placeholder) */}
        {!loadingState.loaded && image.src && (
          <img
            src={getPlaceholderUrl(image.src)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-contain blur-sm opacity-60 transition-opacity duration-300"
            onLoad={loadingHandlers.onPlaceholderLoad}
            style={{
              opacity: loadingState.loaded ? 0 : (loadingState.placeholderLoaded ? 0.6 : 0)
            }}
          />
        )}

        <LoadingStates 
          loaded={loadingState.loaded}
          placeholderLoaded={loadingState.placeholderLoaded}
          error={loadingState.error}
        />
        
        {/* Main Image */}
        {image.src && (
          <img
            src={getImageKitUrl(image.src)}
            srcSet={getResponsiveSrcSet(image.src)}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, (max-width: 1280px) 70vw, 60vw"
            alt={image.title || "Image"}
            className={`max-w-full max-h-[90vh] object-contain transition-opacity duration-300 ${
              loadingState.loaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="eager" 
            fetchPriority="high"
            decoding="async"
            draggable={false}
            onLoad={loadingHandlers.onImageLoad}
            onError={loadingHandlers.onImageError}
          />
        )}

        {/* Preload adjacent images */}
        {prevImage?.src && (
          <link rel="preload" as="image" href={getImageKitUrl(prevImage.src)} />
        )}
        {nextImage?.src && (
          <link rel="preload" as="image" href={getImageKitUrl(nextImage.src)} />
        )}
      </div>
      
      <ImageTitle title={image.title} />
      <SwipeIndicators swipeDirection={swipeState.direction} isSwiping={swipeState.isSwiping} />
    </div>
  );
});