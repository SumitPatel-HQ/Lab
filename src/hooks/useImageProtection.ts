import { useEffect, useRef, useState } from 'react';

interface SecurityProtectionOptions {
  onPasswordRequired?: () => void;
  blurOnSuspicious?: boolean;
  preventImageDownload?: boolean;
  blockDevTools?: boolean;
  detectTabSwitch?: boolean;
}

/**
 * Custom hook that adds various security protections to prevent 
 * unauthorized access to images and detect suspicious activity
 */
const useSecurityProtection = ({
  onPasswordRequired = () => {},
  blurOnSuspicious = true,
  preventImageDownload = true,
  blockDevTools = true,
  detectTabSwitch = true,
}: SecurityProtectionOptions = {}) => {
  const [isBlurred, setIsBlurred] = useState(false);
  const suspiciousActivityDetected = useRef(false);
  const devToolsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to handle suspicious activity
  const handleSuspiciousActivity = () => {
    if (suspiciousActivityDetected.current) return;
    
    suspiciousActivityDetected.current = true;
    
    if (blurOnSuspicious) {
      setIsBlurred(true);
    }
    
    // Request password re-entry
    onPasswordRequired();
    
    // Reset the flag after a delay
    setTimeout(() => {
      suspiciousActivityDetected.current = false;
    }, 1000);
  };

  // Detect DevTools opening
  useEffect(() => {
    if (!blockDevTools) return;

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        handleSuspiciousActivity();
      }
    };

    // Check for DevTools via size differentials
    const intervalId = setInterval(detectDevTools, 1000);
    
    // Block keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
    const blockShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        handleSuspiciousActivity();
        return false;
      }
    };
    
    // Block right-click context menu on document
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Event listeners
    window.addEventListener('keydown', blockShortcuts, true);
    document.addEventListener('contextmenu', blockContextMenu);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', blockShortcuts, true);
      document.removeEventListener('contextmenu', blockContextMenu);
      if (devToolsTimeout.current) {
        clearTimeout(devToolsTimeout.current);
      }
    };
  }, [blockDevTools, onPasswordRequired, blurOnSuspicious]);

  // Detect tab/window switching
  useEffect(() => {
    if (!detectTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or minimized window
        devToolsTimeout.current = setTimeout(() => {
          // If they come back after a threshold, treat as suspicious
          if (document.visibilityState === 'visible') {
            handleSuspiciousActivity();
          }
        }, 500);
      } else if (document.visibilityState === 'visible') {
        // Clear timeout if they come back quickly
        if (devToolsTimeout.current) {
          clearTimeout(devToolsTimeout.current);
          devToolsTimeout.current = null;
        }
      }
    };

    const handleBlur = () => {
      // Window lost focus
      handleSuspiciousActivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [detectTabSwitch, onPasswordRequired, blurOnSuspicious]);

  // Prevent image drag and drop, and save operations
  useEffect(() => {
    if (!preventImageDownload) return;

    // Prevent dragstart on images
    const preventDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // Block image save operations
    const blockSave = (e: KeyboardEvent) => {
      // Block Ctrl+S
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent selecting images
    const preventImageSelection = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.style.userSelect = 'none';
        img.style.webkitUserSelect = 'none';
        img.style.msUserSelect = 'none';
        img.draggable = false;
        
        // Prevent direct image access via inspecting element
        img.addEventListener('click', (e) => {
          if (e.detail === 3) { // Triple click
            e.preventDefault();
            handleSuspiciousActivity();
          }
        });
      });
    };

    document.addEventListener('dragstart', preventDrag);
    window.addEventListener('keydown', blockSave);
    
    // Apply to all images, including dynamically loaded ones
    preventImageSelection();
    const observer = new MutationObserver(() => {
      preventImageSelection();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      document.removeEventListener('dragstart', preventDrag);
      window.removeEventListener('keydown', blockSave);
      observer.disconnect();
    };
  }, [preventImageDownload, onPasswordRequired, blurOnSuspicious]);

  // Return blur class and reset function
  return {
    securityClassName: isBlurred ? 'security-blur' : '',
    resetBlur: () => setIsBlurred(false),
  };
};

export default useSecurityProtection; 