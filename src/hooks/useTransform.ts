import { useState, useCallback, useMemo } from 'react';
import { MODAL_CONFIG } from '../components/ImageModal/constants';

export interface TiltState {
  x: number;
  y: number;
  isHovering: boolean;
}

export interface ZoomState {
  scale: number;
  positionX: number;
  positionY: number;
}

export interface UseTransformOptions {
  enableTilt?: boolean;
  swipeOffset?: number;
  dragY?: number;
  isDragging?: boolean;
  isSwiping?: boolean;
}

export const useTransform = ({
  enableTilt = true,
  swipeOffset = 0,
  dragY = 0,
  isDragging = false,
  isSwiping = false,
}: UseTransformOptions) => {
  const [tiltState, setTiltState] = useState<TiltState>({
    x: 0,
    y: 0,
    isHovering: false,
  });

  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    positionX: 0,
    positionY: 0,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!enableTilt || zoomState.scale > 1 || isSwiping || isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    
    setTiltState(prev => ({
      ...prev,
      x: -y * MODAL_CONFIG.HOVER.MAX_TILT,
      y: x * MODAL_CONFIG.HOVER.MAX_TILT,
    }));
  }, [enableTilt, zoomState.scale, isSwiping, isDragging]);

  const handleMouseEnter = useCallback(() => {
    if (!enableTilt || zoomState.scale > 1) return;
    setTiltState(prev => ({ ...prev, isHovering: true }));
  }, [enableTilt, zoomState.scale]);

  const handleMouseLeave = useCallback(() => {
    setTiltState({ x: 0, y: 0, isHovering: false });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoomState(prev => ({
      ...prev,
      scale: Math.max(
        MODAL_CONFIG.ZOOM.MIN,
        Math.min(prev.scale - e.deltaY * MODAL_CONFIG.ZOOM.WHEEL_SENSITIVITY, MODAL_CONFIG.ZOOM.MAX)
      ),
    }));
  }, []);

  const handleDoubleClick = useCallback(() => {
    setZoomState(prev => ({
      scale: prev.scale === 1 ? 2 : 1,
      positionX: prev.scale !== 1 ? 0 : prev.positionX,
      positionY: prev.scale !== 1 ? 0 : prev.positionY,
    }));
  }, []);

  const resetZoom = useCallback(() => {
    if (zoomState.scale < 1.1) {
      setZoomState({
        scale: 1,
        positionX: 0,
        positionY: 0,
      });
    }
  }, [zoomState.scale]);

  const resetTilt = useCallback(() => {
    setTiltState({ x: 0, y: 0, isHovering: false });
  }, []);

  const imageTransform = useMemo(() => {
    let transform = '';
    
    transform += `perspective(${MODAL_CONFIG.HOVER.PERSPECTIVE}px) `;
    
    if (zoomState.scale !== 1) {
      transform += `scale(${zoomState.scale}) `;
    } else if (tiltState.isHovering && enableTilt) {
      transform += `scale(${MODAL_CONFIG.HOVER.SCALE_FACTOR}) `;
    } else if (isDragging) {
      const dragProgress = Math.min(dragY / 300, 1);
      const scaleReduction = 1 - (dragProgress * 0.1);
      transform += `scale(${scaleReduction}) `;
    }
    
    if (swipeOffset !== 0) {
      transform += `translateX(${swipeOffset}px) `;
    }
    
    if (dragY !== 0) {
      transform += `translateY(${dragY}px) `;
    }
    
    if (tiltState.isHovering && enableTilt && zoomState.scale === 1 && !isSwiping && !isDragging) {
      transform += `rotateX(${tiltState.x}deg) rotateY(${tiltState.y}deg) `;
    }
    
    return transform;
  }, [
    zoomState.scale,
    tiltState.isHovering,
    tiltState.x,
    tiltState.y,
    enableTilt,
    isDragging,
    dragY,
    swipeOffset,
    isSwiping,
  ]);

  const imageTransition = useMemo(() => {
    if (isSwiping || isDragging) {
      return 'none';
    } else if (tiltState.isHovering && enableTilt) {
      return 'transform 0.05s linear';
    }
    return `transform ${MODAL_CONFIG.HOVER.TRANSITION_SPEED}s ease-out`;
  }, [isSwiping, isDragging, tiltState.isHovering, enableTilt]);

  const imageShadow = useMemo(() => {
    if (tiltState.isHovering && enableTilt && zoomState.scale === 1 && !isSwiping && !isDragging) {
      return `0 20px 40px -10px ${MODAL_CONFIG.HOVER.SHADOW_COLOR}`;
    }
    return '0 10px 30px -15px rgba(0,0,0,0.2)';
  }, [tiltState.isHovering, enableTilt, zoomState.scale, isSwiping, isDragging]);

  const willChange = useMemo(() => {
    return tiltState.isHovering || isDragging || isSwiping ? 'transform, box-shadow' : 'auto';
  }, [tiltState.isHovering, isDragging, isSwiping]);

  return {
    tiltState,
    zoomState,
    imageTransform,
    imageTransition,
    imageShadow,
    willChange,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onWheel: handleWheel,
      onDoubleClick: handleDoubleClick,
    },
    actions: {
      resetZoom,
      resetTilt,
    },
  };
};