import React, { useEffect, useState, useCallback, useRef } from 'react';

export interface SecurityProtectionOptions {
  onSuspiciousActivity?: () => void;
}

/**
 * A custom hook that provides security protection features:
 * - Prevents right-clicking on images
 * - Blocks image drag and drop
 * - Disables DevTools shortcuts
 * - Detects tab switching
 * - Blurs screen on suspicious activity
 * - Attempts to detect and react to screenshots
 * - Adds visual noise to make screenshots less useful
 */
const useSecurityProtection = (options: SecurityProtectionOptions = {}) => {
  const { onSuspiciousActivity } = options;
  const [isBlurred, setIsBlurred] = useState(false);
  const [isScreenshotAttempted, setIsScreenshotAttempted] = useState(false);
  const noiseOverlayRef = useRef<HTMLDivElement | null>(null);
  
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
    
    // Print Screen key (screenshot on Windows)
    if (e.key === 'PrintScreen') {
      handleScreenshotAttempt();
      return false;
    }
    
    // Command+Shift+3 or Command+Shift+4 (macOS screenshot)
    if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) {
      handleScreenshotAttempt();
      return false;
    }
    
    return true;
  }, [onSuspiciousActivity]);
  
  // Handle screenshot attempt
  const handleScreenshotAttempt = useCallback(() => {
    setIsScreenshotAttempted(true);
    setIsBlurred(true);
    onSuspiciousActivity?.();
    
    // After a small delay (to ensure it gets captured in the screenshot), 
    // show a visual noise overlay to make the screenshot less useful
    requestAnimationFrame(() => {
      if (noiseOverlayRef.current) {
        noiseOverlayRef.current.style.opacity = '1';
      }
      
      // After 1 second, hide the noise overlay
      setTimeout(() => {
        if (noiseOverlayRef.current) {
          noiseOverlayRef.current.style.opacity = '0';
        }
        setIsScreenshotAttempted(false);
      }, 1000);
    });
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
      
      .security-blur {
        filter: blur(20px);
        transition: filter 0.3s ease;
      }
      
      .noise-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0;
        z-index: 9999;
        pointer-events: none;
        mix-blend-mode: difference;
        transition: opacity 0.2s ease;
      }
      
      /* Create a watermark on screenshots */
      @media print {
        body::after {
          content: "PROTECTED CONTENT - UNAUTHORIZED COPY";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: rgba(255, 0, 0, 0.5);
          z-index: 10000;
          white-space: nowrap;
        }
        
        img {
          visibility: hidden;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Create noise overlay div
    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'noise-overlay';
    document.body.appendChild(noiseOverlay);
    noiseOverlayRef.current = noiseOverlay;
  }, []);
  
  // Detect screenshot attempts on iOS/Safari
  const detectIosScreenshot = useCallback(() => {
    // iOS screenshots trigger a brief visual effect
    // We can detect this by checking if the window was hidden very briefly
    let hiddenTime = 0;
    let wasHidden = false;
    
    // When the window becomes hidden, record the time
    const handleVisibilityHidden = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTime = Date.now();
        wasHidden = true;
      }
    };
    
    // When the window becomes visible again, check how long it was hidden
    const handleVisibilityVisible = () => {
      if (wasHidden && document.visibilityState === 'visible') {
        const hiddenDuration = Date.now() - hiddenTime;
        wasHidden = false;
        
        // iOS screenshots typically cause a visibility change for ~20-100ms
        // This is an approximation and may have false positives/negatives
        if (hiddenDuration > 20 && hiddenDuration < 100) {
          handleScreenshotAttempt();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityHidden);
    document.addEventListener('visibilitychange', handleVisibilityVisible);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityHidden);
      document.removeEventListener('visibilitychange', handleVisibilityVisible);
    };
  }, [handleScreenshotAttempt]);
  
  // Setup Android screenshot detection
  const detectAndroidScreenshot = useCallback(() => {
    // On Android, we can subscribe to media content changes
    // This approach won't work if not used in a secure context (HTTPS)
    if (typeof navigator.mediaDevices !== 'undefined' && 
        typeof navigator.mediaDevices.ondevicechange === 'function') {
      
      // This won't directly tell us a screenshot happened, but might
      // trigger if the screenshot shows up as a new media device
      const handleDeviceChange = () => {
        // This is a best-effort detection that might coincide with screenshots
        handleScreenshotAttempt();
      };
      
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
    
    return () => {};
  }, [handleScreenshotAttempt]);
  
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
    
    // Set up iOS screenshot detection
    const cleanupIosDetection = detectIosScreenshot();
    
    // Set up Android screenshot detection
    const cleanupAndroidDetection = detectAndroidScreenshot();
    
    // Clean up
    return () => {
      window.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('dragstart', preventDragStart);
      document.removeEventListener('selectstart', preventSelection as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', detectDevTools);
      
      cleanupIosDetection();
      cleanupAndroidDetection();
      
      // Remove noise overlay
      if (noiseOverlayRef.current && noiseOverlayRef.current.parentNode) {
        noiseOverlayRef.current.parentNode.removeChild(noiseOverlayRef.current);
      }
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
    detectIosScreenshot,
    detectAndroidScreenshot,
  ]);
  
  // Return security-related properties
  return {
    isBlurred,
    unblur: () => setIsBlurred(false),
    blurClassName: isBlurred ? 'security-blur' : '',
    isScreenshotAttempted,
  };
};

export default useSecurityProtection; 