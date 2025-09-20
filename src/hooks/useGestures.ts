import { useState, useRef, useCallback } from 'react';
import { MODAL_CONFIG, easing } from '../components/ImageModal/constants';

export interface SwipeState {
  offset: number;
  direction: 'left' | 'right' | null;
  isSwiping: boolean;
}

export interface DragState {
  y: number;
  isDragging: boolean;
  velocity: number;
}

export interface UseGesturesOptions {
  onSwipeComplete?: (direction: 'left' | 'right') => void;
  onDismiss?: () => void;
  scale?: number;
}

export const useGestures = ({ onSwipeComplete, onDismiss, scale = 1 }: UseGesturesOptions) => {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    offset: 0,
    direction: null,
    isSwiping: false,
  });
  
  const [dragState, setDragState] = useState<DragState>({
    y: 0,
    isDragging: false,
    velocity: 0,
  });

  // Touch tracking refs
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number | null>(null);
  const lastTouchYRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const cancelAnimation = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  const animateSwipeReset = useCallback(() => {
    cancelAnimation();
    
    const startOffset = swipeState.offset;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / MODAL_CONFIG.ANIMATION.DURATION, 1);
      const easeProgress = easing.easeOutQuad(progress);
      
      const newOffset = startOffset * (1 - easeProgress);
      
      setSwipeState(prev => ({ ...prev, offset: newOffset }));
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        setSwipeState(prev => ({ ...prev, offset: 0, direction: null }));
        cancelAnimation();
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [swipeState.offset, cancelAnimation]);

  const animateSwipeCompletion = useCallback((direction: 'left' | 'right') => {
    cancelAnimation();
    
    const startOffset = swipeState.offset;
    const targetOffset = direction === 'right' ? window.innerWidth : -window.innerWidth;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / 100, 1);
      const easeProgress = easing.easeInQuad(progress);
      
      const newOffset = startOffset + (targetOffset - startOffset) * easeProgress;
      
      setSwipeState(prev => ({ ...prev, offset: newOffset }));
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimation();
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [swipeState.offset, cancelAnimation]);

  const animateVerticalReset = useCallback(() => {
    cancelAnimation();
    
    const startY = dragState.y;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / MODAL_CONFIG.ANIMATION.DURATION, 1);
      const easeProgress = easing.easeOutQuart(progress);
      
      const newY = startY * (1 - easeProgress);
      
      setDragState(prev => ({ ...prev, y: newY }));
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        setDragState(prev => ({ ...prev, y: 0 }));
        cancelAnimation();
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [dragState.y, cancelAnimation]);

  const animateDismiss = useCallback(() => {
    if (!onDismiss) return;
    
    cancelAnimation();
    
    const startY = dragState.y;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / MODAL_CONFIG.DISMISS.ANIMATION_DURATION, 1);
      const easeProgress = easing.easeOutCubic(progress);
      
      const newY = startY + (MODAL_CONFIG.DISMISS.DISTANCE - startY) * easeProgress;
      
      setDragState(prev => ({ ...prev, y: newY }));
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimation();
        onDismiss();
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [dragState.y, onDismiss, cancelAnimation]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = performance.now();
      lastTouchTimeRef.current = performance.now();
      lastTouchYRef.current = e.touches[0].clientY;
      
      setDragState(prev => ({ ...prev, isDragging: false, velocity: 0 }));
      setSwipeState(prev => ({ ...prev, isSwiping: false }));
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || scale > 1) return;
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;
    
    // Determine gesture type if not already determined
    if (!swipeState.isSwiping && !dragState.isDragging) {
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        setDragState(prev => ({ ...prev, isDragging: true }));
      } else if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        setSwipeState(prev => ({ ...prev, isSwiping: true }));
      }
    }
    
    if (dragState.isDragging && deltaY > 0) {
      // Calculate velocity
      if (lastTouchYRef.current !== null && lastTouchTimeRef.current !== null) {
        const timeDelta = performance.now() - lastTouchTimeRef.current;
        if (timeDelta > 0) {
          const instantVelocity = (currentY - lastTouchYRef.current) / timeDelta;
          setDragState(prev => ({ ...prev, velocity: instantVelocity }));
        }
      }
      
      // Apply resistance
      const resistFactor = 0.7 - (Math.min(deltaY, 300) / 1000);
      const resistedDeltaY = deltaY * resistFactor;
      setDragState(prev => ({ ...prev, y: resistedDeltaY }));
      
      lastTouchYRef.current = currentY;
      lastTouchTimeRef.current = performance.now();
      e.preventDefault();
    } else if (swipeState.isSwiping) {
      const resistedDeltaX = deltaX * MODAL_CONFIG.SWIPE.RESISTANCE;
      
      setSwipeState(prev => ({
        ...prev,
        offset: resistedDeltaX,
        direction: deltaX > 10 ? 'right' : deltaX < -10 ? 'left' : null,
      }));
      
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    }
  }, [scale, swipeState.isSwiping, dragState.isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (dragState.isDragging) {
      if (dragState.velocity > MODAL_CONFIG.DISMISS.VELOCITY_THRESHOLD || 
          dragState.y > MODAL_CONFIG.DISMISS.THRESHOLD) {
        animateDismiss();
      } else {
        animateVerticalReset();
      }
      setDragState(prev => ({ ...prev, isDragging: false }));
    } else if (swipeState.isSwiping && touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartXRef.current;
      const touchDuration = performance.now() - (touchStartTimeRef.current || 0);
      
      const velocity = Math.abs(deltaX) / touchDuration;
      const isQuickSwipe = velocity > MODAL_CONFIG.SWIPE.VELOCITY_THRESHOLD;
      const effectiveThreshold = isQuickSwipe ? 
        MODAL_CONFIG.SWIPE.THRESHOLD * 0.7 : 
        MODAL_CONFIG.SWIPE.THRESHOLD;
      
      if (Math.abs(deltaX) >= effectiveThreshold || isQuickSwipe) {
        const direction = deltaX > 0 ? 'right' : 'left';
        animateSwipeCompletion(direction);
        
        setTimeout(() => {
          if (onSwipeComplete) {
            onSwipeComplete(direction);
          }
        }, 100);
      } else {
        animateSwipeReset();
      }
    }
    
    // Reset touch tracking
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchStartTimeRef.current = null;
    lastTouchYRef.current = null;
    lastTouchTimeRef.current = null;
    setSwipeState(prev => ({ ...prev, isSwiping: false }));
  }, [
    dragState.isDragging, 
    dragState.velocity, 
    dragState.y, 
    swipeState.isSwiping, 
    animateDismiss, 
    animateVerticalReset, 
    animateSwipeCompletion, 
    animateSwipeReset, 
    onSwipeComplete
  ]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    cancelAnimation();
  }, [cancelAnimation]);

  return {
    swipeState,
    dragState,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    cleanup,
  };
};