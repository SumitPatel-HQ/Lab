import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { getOptimizedImageUrl, createImageTransformations } from '../../../services/ImageKit/config';
import { rafThrottle, createIntersectionObserver } from './animationUtils';

export const HOVER_CONFIG = {
  SCALE_FACTOR: 1.3,
  TRANSITION_SPEED: 0.2,
  SHADOW_COLOR: 'rgba(0,0,0,0.5)',
  USE_HIGH_QUALITY: true,
} as const;

interface UseHoverAnimationProps {
  imageUrl: string;
}

export const useHoverAnimation = ({ imageUrl }: UseHoverAnimationProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<NodeListOf<HTMLImageElement> | null>(null);
  const cardRectRef = useRef<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [highQualityUrl, setHighQualityUrl] = useState<string>('');
  
  // Detect if device supports hover (desktop/mouse devices)
  const supportsHover = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  // Generate ultra-high-quality URL - NO COMPROMISE ON QUALITY
  useEffect(() => {
    if (HOVER_CONFIG.USE_HIGH_QUALITY) {
      const imagePath = imageUrl.split('?')[0].replace(import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '', '');
      const hqUrl = getOptimizedImageUrl(imagePath, createImageTransformations.ultra(2400));
      setHighQualityUrl(hqUrl);
    }
  }, [imageUrl]);

  // Cache DOM elements and setup intersection observer
  useEffect(() => {
    const currentCard = cardRef.current;
    if (currentCard) {
      imagesRef.current = currentCard.querySelectorAll('img');
      cardRectRef.current = currentCard.getBoundingClientRect();
      
      const observer = createIntersectionObserver((visible) => {
        setIsVisible(visible);
      }, 0.1);
      
      observer.observe(currentCard);
      
      return () => {
        if (currentCard) {
          observer.unobserve(currentCard);
        }
        observer.disconnect();
      };
    }
  }, []);

  // Simple hover handler - only scale (disabled on touch devices)
  const handleMouseMoveRaw = useCallback(() => {
    if (!cardRef.current || !isVisible || !supportsHover) return;

    // Apply scale transform only
    const card = cardRef.current;
    card.style.setProperty('--scale', HOVER_CONFIG.SCALE_FACTOR.toString());
    card.setAttribute('data-hovering', 'true');
    
    // Apply high-quality to images
    if (imagesRef.current) {
      imagesRef.current.forEach(img => {
        img.style.imageRendering = 'high-quality';
        img.style.filter = 'contrast(1.05) saturate(1.1)';
      });
    }
  }, [isVisible, supportsHover]);

  // Mouse enter handler - immediate response (disabled on touch devices)
  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current || !supportsHover) return;
    
    // Immediately apply hover state
    const card = cardRef.current;
    card.style.setProperty('--scale', HOVER_CONFIG.SCALE_FACTOR.toString());
    card.setAttribute('data-hovering', 'true');
    
    const parentDiv = card.parentElement;
    if (parentDiv) {
      parentDiv.style.setProperty('z-index', '99999', 'important');
      parentDiv.style.setProperty('position', 'relative', 'important');
      parentDiv.style.setProperty('isolation', 'isolate', 'important');
    }
  }, [supportsHover]);


  // Mouse leave handler (disabled on touch devices)
  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current || !supportsHover) return;
    
    const parentDiv = cardRef.current.parentElement;
    if (parentDiv) {
      setTimeout(() => {
        parentDiv.style.removeProperty('z-index');
        parentDiv.style.removeProperty('isolation');
      }, HOVER_CONFIG.TRANSITION_SPEED * 1000);
    }
    
    // Reset transforms
    cardRef.current.style.setProperty('--scale', '1');
    cardRef.current.removeAttribute('data-hovering');
    
    // Reset high-quality images
    if (imagesRef.current) {
      imagesRef.current.forEach(img => {
        img.style.filter = '';
        img.style.imageRendering = '';
      });
    }
  }, [supportsHover]);

  // Create RAF-throttled mouse handler
  const handleMouseMove = useMemo(
    () => rafThrottle(handleMouseMoveRaw as (...args: unknown[]) => void),
    [handleMouseMoveRaw]
  );

  return {
    cardRef,
    highQualityUrl,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    config: HOVER_CONFIG,
    supportsHover,
  };
};