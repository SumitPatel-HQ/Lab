import React, { useEffect, useState, useCallback } from 'react';

export interface SecurityProtectionOptions {
  onSuspiciousActivity?: () => void;
}

/**
 * A custom hook that provides image protection features:
 * - Prevents right-clicking on images
 * - Blocks image drag and drop
 * - Disables DevTools shortcuts
 * - Detects tab switching
 * - Blurs screen on suspicious activity
 */
const useImageProtection = ({
  onSuspiciousActivity,
}: SecurityProtectionOptions) => {
  const [isBlurred, setIsBlurred] = useState(false);
  
  // Prevent context menu (right-click)
  const preventContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);
  
  // Prevent drag and drop
  const preventDragStart = useCallback((e: DragEvent) => {
    e.preventDefault();
    return false;
  }, []);
  
  // Prevent selection
  const preventSelection = useCallback((e: Event) => {
    e.preventDefault();
    return false;
  }, []);
  
  // Handle keyboard shortcuts that might open DevTools
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // F12 key
    if (e.key === 'F12') {
      e.preventDefault();
      setIsBlurred(true);
      onSuspiciousActivity?.();
      return false;
    }
    
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Chrome DevTools)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
      setIsBlurred(true);
      onSuspiciousActivity?.();
      return false;
    }
    
    // Ctrl+U (View source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      setIsBlurred(true);
      onSuspiciousActivity?.();
      return false;
    }
    
    return true;
  }, [onSuspiciousActivity]);
  
  // Detect visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      onSuspiciousActivity?.();
    }
  }, [onSuspiciousActivity]);
  
  // Detect blur event (window losing focus)
  const handleBlur = useCallback(() => {
    onSuspiciousActivity?.();
  }, [onSuspiciousActivity]);
  
  // Apply CSS to prevent image saving
  const applyImageProtectionCSS = useCallback(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        pointer-events: none;
      }
      
      .blur-protection {
        filter: blur(20px);
        transition: filter 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }, []);
  
  // Apply all protection measures
  useEffect(() => {
    // Apply CSS protection for images
    applyImageProtectionCSS();
    
    // Add event listeners
    window.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('dragstart', preventDragStart);
    document.addEventListener('selectstart', preventSelection as EventListener);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    // Detect DevTools using resize method
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        setIsBlurred(true);
        onSuspiciousActivity?.();
      }
    };
    
    window.addEventListener('resize', detectDevTools);
    
    // Clean up
    return () => {
      window.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('dragstart', preventDragStart);
      document.removeEventListener('selectstart', preventSelection as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', detectDevTools);
    };
  }, [
    preventContextMenu,
    preventDragStart,
    preventSelection,
    handleKeyDown,
    handleVisibilityChange,
    handleBlur,
    applyImageProtectionCSS,
    onSuspiciousActivity,
  ]);
  
  // Return blur state and a function to unblur
  return {
    isBlurred,
    unblur: () => setIsBlurred(false),
    blurClassName: isBlurred ? 'blur-protection' : '',
  };
};

export default useImageProtection; 