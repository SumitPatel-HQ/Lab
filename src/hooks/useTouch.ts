import { useState, useRef, useCallback, useEffect } from 'react';

interface TouchHandlerConfig {
  onNext: () => void;
  onPrev: () => void;
  isTransitioning: boolean;
  screenWidth: number;
}

interface TouchHandlerState {
  isDragging: boolean;
  dragOffset: number;
  swipeProgress: number;
}

interface TouchHandlerHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const SWIPE_THRESHOLD = 0;
const VELOCITY_THRESHOLD = 0.02;
const SWIPE_RESISTANCE = 0.2;
const SPRING_ANIMATION_DURATION = 100;
const SWIPE_EXIT_DURATION = 100;

export const useTouchHandler = ({ 
  onNext, 
  onPrev, 
  isTransitioning, 
  screenWidth 
}: TouchHandlerConfig): TouchHandlerState & TouchHandlerHandlers => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const lastTouchRef = useRef<{x: number, y: number} | null>(null);
  const velocityXRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const swipeDirectionRef = useRef<'left' | 'right' | null>(null);

  // Cleanup animation frames on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, []);

  // Animation helper functions
  const animateSwipeCompletion = useCallback((direction: 'left' | 'right') => {
    setIsDragging(false);
    
    const startOffset = dragOffset;
    const targetOffset = direction === 'left' ? -screenWidth * 0.6 : screenWidth * 0.6;
    const startTime = performance.now();
    const duration = SWIPE_EXIT_DURATION;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setSwipeProgress(progress);
      setDragOffset(startOffset + (targetOffset - startOffset) * progress);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        setDragOffset(0);
        setSwipeProgress(0);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
        
        if (direction === 'left') {
          onNext();
        } else {
          onPrev();
        }
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [dragOffset, screenWidth, onNext, onPrev]);

  const animateSpringReset = useCallback(() => {
    const startOffset = dragOffset;
    const startTime = performance.now();
    const duration = SPRING_ANIMATION_DURATION;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      
      setDragOffset(startOffset * (1 - easedProgress));
      setSwipeProgress(swipeProgress * (1 - easedProgress));
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        setDragOffset(0);
        setSwipeProgress(0);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [dragOffset, swipeProgress]);

  // Touch event handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    const touch = e.targetTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = performance.now();
    velocityXRef.current = 0;
    setIsDragging(true);
    setDragOffset(0);
    swipeDirectionRef.current = null;
    setSwipeProgress(0);
  }, [isTransitioning]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) return;
    
    const touch = e.targetTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    
    e.preventDefault();
    
    if (lastTouchRef.current !== null) {
      const timeDelta = performance.now() - (touchStartTimeRef.current || performance.now());
      if (timeDelta > 0) {
        const instantVelocityX = (touch.clientX - lastTouchRef.current.x) / timeDelta;
        velocityXRef.current = velocityXRef.current * 0.1 + instantVelocityX * 0.9;
      }
    }
    
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    
    const resistedDeltaX = deltaX * SWIPE_RESISTANCE;
    const direction = deltaX < 0 ? 'left' : 'right';
    
    if (swipeDirectionRef.current !== direction) {
      swipeDirectionRef.current = direction;
    }
    
    const progress = Math.min(Math.abs(deltaX) / (screenWidth * 0.1), 1);
    setSwipeProgress(progress);
    setDragOffset(resistedDeltaX);
    
    if (progress > 0.7 && !isTransitioning) {
      animateSwipeCompletion(direction);
    }
  }, [isDragging, isTransitioning, screenWidth, animateSwipeCompletion]);

  const onTouchEnd = useCallback(() => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) {
      setIsDragging(false);
      return;
    }
    
    const touchEnd = lastTouchRef.current;
    if (!touchEnd) {
      setIsDragging(false);
      return;
    }
    
    const deltaX = touchEnd.x - touchStartRef.current.x;
    const velocity = Math.abs(velocityXRef.current);
    const isQuickSwipe = velocity > VELOCITY_THRESHOLD;
    const effectiveThreshold = isQuickSwipe ? 1 : SWIPE_THRESHOLD;
    
    setIsDragging(false);
    
    if (Math.abs(deltaX) >= effectiveThreshold || isQuickSwipe) {
      animateSwipeCompletion(deltaX < 0 ? 'left' : 'right');
    } else {
      animateSpringReset();
    }
    
    touchStartRef.current = null;
    lastTouchRef.current = null;
    touchStartTimeRef.current = null;
    velocityXRef.current = 0;
  }, [isDragging, isTransitioning, animateSwipeCompletion, animateSpringReset]);

  return {
    isDragging,
    dragOffset,
    swipeProgress,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};
