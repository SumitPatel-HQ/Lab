import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { getOptimizedImageUrl, createImageTransformations } from '../../../services/ImageKit/config';
import { rafThrottle, createIntersectionObserver } from './animationUtils';

export const HOVER_CONFIG = {
  MAX_TILT: 2, // Reduced from 10 for less intense 3D effect
  SCALE_FACTOR: 1.4,
  TRANSITION_SPEED: 0.7,
  PERSPECTIVE: 1000,
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

  // Optimized mouse move handler
  const handleMouseMoveRaw = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isVisible) return;

    const rect = cardRectRef.current || cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate 3D transforms
    const rotateX = (y - centerY) / centerY * -HOVER_CONFIG.MAX_TILT;
    const rotateY = (x - centerX) / centerX * HOVER_CONFIG.MAX_TILT;

    // Apply transforms using CSS custom properties
    const card = cardRef.current;
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
    card.style.setProperty('--scale', HOVER_CONFIG.SCALE_FACTOR.toString());
    card.setAttribute('data-hovering', 'true');
    
    // Apply ultra-high-quality to images
    if (imagesRef.current) {
      imagesRef.current.forEach(img => {
        img.style.imageRendering = 'high-quality';
        img.style.filter = 'contrast(1.05) saturate(1.1) sharpen(0.2px)';
        img.style.transform = 'translateZ(0)';
      });
    }
  }, [isVisible]);

  // Mouse enter handler
  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    
    const parentDiv = cardRef.current.parentElement;
    if (parentDiv) {
      parentDiv.style.setProperty('z-index', '99999', 'important');
      parentDiv.style.setProperty('position', 'relative', 'important');
      parentDiv.style.setProperty('isolation', 'isolate', 'important');
    }
  }, []);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    
    const parentDiv = cardRef.current.parentElement;
    if (parentDiv) {
      setTimeout(() => {
        parentDiv.style.removeProperty('z-index');
        parentDiv.style.removeProperty('isolation');
      }, HOVER_CONFIG.TRANSITION_SPEED * 1000);
    }
    
    // Reset transforms
    cardRef.current.style.setProperty('--rotate-x', '0deg');
    cardRef.current.style.setProperty('--rotate-y', '0deg');
    cardRef.current.style.setProperty('--scale', '1');
    cardRef.current.removeAttribute('data-hovering');
    
    // Reset ultra-high-quality images
    if (imagesRef.current) {
      imagesRef.current.forEach(img => {
        img.style.filter = '';
        img.style.transform = '';
        img.style.imageRendering = '';
      });
    }
  }, []);

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
  };
};