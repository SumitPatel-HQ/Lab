// Card utilities for positioning and styling
export const RESPONSIVE_SIZES = 'w-[80vw] sm:w-[70vw] md:w-[50vw] lg:w-[40vw] max-w-lg';

export const getAspectRatioClass = (ratio: string) => {
  return ratio === '2:3' ? 'aspect-[2/3]' : 'aspect-[3/2]';
};

export const getCardPosition = (
  index: number,
  activeIndex: number,
  totalImages: number,
  isDragging: boolean,
  isMobile: boolean
) => {
  const diff = index - activeIndex;
  const isActive = diff === 0;
  const isPrev = diff === -1 || (activeIndex === 0 && index === totalImages - 1);
  const isNext = diff === 1 || (activeIndex === totalImages - 1 && index === 0);
  
  if (isActive) {
    return {
      transform: 'translate(-50%, -50%)',
      zIndex: 30,
      opacity: 1
    };
  }
  
  if (isPrev) {
    return {
      transform: isMobile && isDragging 
        ? 'translate(-60%, -50%) scale(0.9)'
        : 'translate(-60%, -50%) rotate(-10deg) scale(0.9)',
      zIndex: 20,
      opacity: 0.7
    };
  }
  
  if (isNext) {
    return {
      transform: isMobile && isDragging
        ? 'translate(-40%, -50%) scale(0.9)'
        : 'translate(-40%, -50%) rotate(10deg) scale(0.9)',
      zIndex: 20,
      opacity: 0.7
    };
  }
  
  return {
    transform: 'translate(-50%, -50%) scale(0.8)',
    zIndex: 10,
    opacity: 0
  };
};

export const IMAGE_TRANSFORMATIONS = {
  placeholder: [{
    quality: 10,
    width: 20,
    blur: 10,
    format: "auto" as const
  }],
  main: [{
    quality: 100, // Ultra-high quality for main gallery images
    format: "auto" as const,
    progressive: true,
    width: 1600, // Constrain width to speed up loading while staying sharp
    dpr: 2 // High DPI support for crisp images
  }]
};