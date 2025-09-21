import React, { useRef, useCallback, memo } from 'react';
import { Parallax } from 'react-parallax';
import './hoverFix.css';

const HOVER_CONFIG = {
  MAX_TILT: 10, // Maximum rotation in degrees
  SCALE_FACTOR: 1.7, // How much to scale up on hover
  TRANSITION_SPEED: 0.7, // Transition speed in seconds
  PERSPECTIVE: 1000, // Perspective value for 3D effect
  SHADOW_COLOR: 'rgba(0,0,0,0.2)', // Shadow color
};

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
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // 3D tilt effect using config
    const rotateX = (y - centerY) / centerY * -HOVER_CONFIG.MAX_TILT;
    const rotateY = (x - centerX) / centerX * HOVER_CONFIG.MAX_TILT;

    // Smooth ease-in transition for mouse movement using config speed
    const transitionSpeed = HOVER_CONFIG.TRANSITION_SPEED * 0.2; // Faster for mouse movement
    cardRef.current.style.transition = `transform ${transitionSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow ${HOVER_CONFIG.TRANSITION_SPEED * 0.4}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    
    cardRef.current.style.transform = `
      perspective(${HOVER_CONFIG.PERSPECTIVE}px) 
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg) 
      translateY(-10px)
      scale(${HOVER_CONFIG.SCALE_FACTOR})
    `;
    
    // Enhanced shadow on hover with configurable color
    cardRef.current.style.boxShadow = `0 25px 50px -12px ${HOVER_CONFIG.SHADOW_COLOR}, 0 10px 10px -5px rgba(0, 0, 0, 0.04)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    
    // Reset z-index after animation completes
    const parentDiv = cardRef.current.parentElement;
    if (parentDiv) {
      setTimeout(() => {
        parentDiv.style.removeProperty('z-index');
        parentDiv.style.removeProperty('isolation');
      }, HOVER_CONFIG.TRANSITION_SPEED * 1000); // Convert to milliseconds
    }
    
    // Smooth ease-out transition when leaving using config
    cardRef.current.style.transition = `transform ${HOVER_CONFIG.TRANSITION_SPEED}s cubic-bezier(0.16, 1, 0.3, 1), box-shadow ${HOVER_CONFIG.TRANSITION_SPEED}s cubic-bezier(0.16, 1, 0.3, 1)`;
    
    cardRef.current.style.transform = `
      perspective(${HOVER_CONFIG.PERSPECTIVE}px) 
      rotateX(0deg) 
      rotateY(0deg) 
      translateY(0px)
      scale(1)
    `;
    
    // Reset shadow with smooth ease-out
    cardRef.current.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    
    // Bring to front immediately with JavaScript - use higher z-index
    const parentDiv = cardRef.current.parentElement;
    if (parentDiv) {
      parentDiv.style.setProperty('z-index', '99999', 'important');
      parentDiv.style.setProperty('position', 'relative', 'important');
      parentDiv.style.setProperty('isolation', 'isolate', 'important');
    }
    
    // Initial smooth ease-in when entering using config
    const enterSpeed = HOVER_CONFIG.TRANSITION_SPEED * 0.3; // Faster entry
    cardRef.current.style.transition = `transform ${enterSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow ${enterSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
  }, []);

  return (
    <div
      className={`${layoutMode === 'masonry' ? 'mb-4 break-inside-avoid' : ''} group relative cursor-pointer hover-animation-container ${className}`}
      onClick={onImageClick}
      style={{
        zIndex: 1,
        position: 'relative'
      }}
    >
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-2xl ease-out"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          transition: `all ${HOVER_CONFIG.TRANSITION_SPEED * 0.4}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Parallax
          bgImage={imageUrl}
          strength={150}
          className="w-full h-full"
          bgImageStyle={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        >
          <div className="relative">
            {children}
            
            {/* Smooth gradient overlay with configurable timing */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100"
              style={{ transition: `opacity ${HOVER_CONFIG.TRANSITION_SPEED * 0.7}s cubic-bezier(0.25, 0.46, 0.45, 0.94)` }}
            ></div>
            
            {/* Title with configurable smooth animation */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0"
              style={{ transition: `transform ${HOVER_CONFIG.TRANSITION_SPEED * 0.6}s cubic-bezier(0.16, 1, 0.3, 1), opacity ${HOVER_CONFIG.TRANSITION_SPEED * 0.4}s cubic-bezier(0.25, 0.46, 0.45, 0.94)` }}
            >
              <h3 
                className="text-white text-sm font-medium drop-shadow-lg opacity-0 group-hover:opacity-100"
                style={{ transition: `opacity ${HOVER_CONFIG.TRANSITION_SPEED * 0.4}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${HOVER_CONFIG.TRANSITION_SPEED * 0.1}s` }}
              >
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