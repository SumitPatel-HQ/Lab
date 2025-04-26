import React, { useState, useEffect } from 'react';
import ImageGallery from './components/ImageGallery';
import PasswordProtection from './components/PasswordProtection';
import useSecurityProtection from './hooks/useSecurityProtection';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Set your password here - current password: 2000
  const PASSWORD = "2000";
  
  // Use the security protection hook
  const { isBlurred, unblur, blurClassName } = useSecurityProtection({
    onSuspiciousActivity: () => setIsAuthenticated(false),
  });
  
  // Add additional security by resetting auth state when window gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If the page becomes visible after being hidden
      if (document.visibilityState === 'visible' && !isAuthenticated) {
        // This helps synchronize auth state across tabs
        sessionStorage.setItem('session_expired', 'true');
        sessionStorage.removeItem('session_expired');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => setIsAuthenticated(false));
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => setIsAuthenticated(false));
    };
  }, [isAuthenticated]);
  
  const handleAuthentication = () => {
    setIsAuthenticated(true);
    unblur(); // Clear any blur when authentication succeeds
  };

  return (
    <div className={`min-h-screen bg-gray-900 dark:bg-gray-900 ${isBlurred ? blurClassName : ''}`}>
      {!isAuthenticated ? (
        <PasswordProtection 
          onAuthenticated={handleAuthentication} 
          correctPassword={PASSWORD} 
        />
      ) : (
        <ImageGallery />
      )}
    </div>
  );
}

export default App;