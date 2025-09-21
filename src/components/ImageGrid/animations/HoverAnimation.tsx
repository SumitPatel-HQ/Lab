import React, { memo } from 'react';
import { Parallax } from 'react-parallax';
import { useHoverAnimation } from './useHoverAnimation';
import './hoverFix.css';

interface HoverAnimationProps {
  children: React.ReactNode;
  imageUrl: string;
  title: string;
  className?: string;
  layoutMode: 'grid' | 'masonry';
  onImageClick: () => void;
}

const HoverAnimation: React.FC<HoverAnimationProps> = memo(({
  children,
  imageUrl,
  title,
  className = '',
  layoutMode,
  onImageClick
}) => {
  const {
    cardRef,
    highQualityUrl,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    config
  } = useHoverAnimation({ imageUrl });

  return (
    <div
      className={`${layoutMode === 'masonry' ? 'mb-4 break-inside-avoid' : ''} group relative cursor-pointer hover-animation-container ${className}`}
      onClick={onImageClick}
      style={{ zIndex: 1, position: 'relative' }}
    >
      <div
        ref={cardRef}
        className="hover-card relative overflow-hidden rounded-lg"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          '--transition-speed': `${config.TRANSITION_SPEED}s`,
          '--perspective': `${config.PERSPECTIVE}px`,
          '--shadow-color': config.SHADOW_COLOR,
        } as React.CSSProperties}
      >
        <Parallax
          bgImage={highQualityUrl || imageUrl}
          strength={0}
          className="w-full h-full"
          bgImageStyle={{
            objectFit: 'cover',
            objectPosition: 'center',
            imageRendering: 'high-quality',
            filter: 'contrast(1.02) saturate(1.05)',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased',
            WebkitTransform: 'translateZ(0)',
            MozTransform: 'translateZ(0)',
            msTransform: 'translateZ(0)',
            OTransform: 'translateZ(0)'
          }}
        >
          <div className="relative">
            {children}
            
            {/* CSS-driven gradient overlay */}
            <div className="hover-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* CSS-driven title animation */}
            <div className="hover-title-container absolute bottom-0 left-0 right-0 p-3">
              <h3 className="hover-title-text text-white text-sm font-medium drop-shadow-lg">
                {title}
              </h3>
            </div>
          </div>
        </Parallax>
      </div>
    </div>
  );
});

HoverAnimation.displayName = 'HoverAnimation';

export default HoverAnimation;