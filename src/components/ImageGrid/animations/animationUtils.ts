// Animation utilities for optimized hover effects
export const ANIMATION_CONFIG = {
  // 3D Transform settings
  maxRotation: 10,
  perspective: 1000,
  scale: 1.05,
  
  // Timing configurations
  transitionDuration: '0.3s',
  transitionEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Parallax settings
  parallaxStrength: 200,
  
  // Performance optimizations
  useTransform3d: true,
  enableHardwareAcceleration: true
} as const;

export const createTransform3D = (
  rotateX: number, 
  rotateY: number, 
  scale: number = 1
): string => {
  return `perspective(${ANIMATION_CONFIG.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
};

export const calculateRotation = (
  mouseX: number,
  mouseY: number,
  centerX: number,
  centerY: number
): { rotateX: number; rotateY: number } => {
  const rotateX = (mouseY - centerY) / centerY * -ANIMATION_CONFIG.maxRotation;
  const rotateY = (mouseX - centerX) / centerX * ANIMATION_CONFIG.maxRotation;
  
  return { rotateX, rotateY };
};

export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay);
    }
  };
};

// Intersection Observer for performance optimization
export const createIntersectionObserver = (
  callback: (isVisible: boolean) => void,
  threshold: number = 0.1
): IntersectionObserver => {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry.isIntersecting);
      });
    },
    { threshold }
  );
};