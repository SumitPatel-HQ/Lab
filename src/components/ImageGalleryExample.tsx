import React, { useState } from 'react';
import useImageProtection from '../hooks/useImageProtection';
import PasswordProtection from './PasswordProtection';

// This is an example of how to integrate the useImageProtection hook
// with the existing ImageGallery component without modifying its structure

/**
 * Example wrapper for ImageGallery that adds security features
 * 
 * HOW TO USE THIS IN YOUR EXISTING CODE:
 * 
 * 1. In your ImageGallery.tsx file, add the following at the top:
 *    import useImageProtection from '../hooks/useImageProtection';
 * 
 * 2. Add this hook inside your ImageGallery component:
 *    const { isBlurred, unblur, blurClassName } = useImageProtection({
 *      onSuspiciousActivity: () => {
 *        // Optional: Add your own callback for suspicious activity
 *        // For example: redirect to login, show warning, etc.
 *      }
 *    });
 * 
 * 3. If you want to implement blur protection, add the blurClassName to your main container:
 *    <div className={`your-existing-classes ${blurClassName}`}>
 * 
 * That's it! The hook handles all the protection features automatically.
 */

const ImageGalleryWithProtection: React.FC = () => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const PASSWORD = "2000"; // Example password
  
  // Use the image protection hook
  const { isBlurred, unblur, blurClassName } = useImageProtection({
    onSuspiciousActivity: () => {
      // When suspicious activity is detected, show the password prompt
      setShowPasswordPrompt(true);
    }
  });
  
  const handleAuthentication = () => {
    // When authentication succeeds, hide the password prompt and unblur
    setShowPasswordPrompt(false);
    unblur();
  };

  return (
    <>
      {showPasswordPrompt ? (
        <PasswordProtection 
          onAuthenticated={handleAuthentication} 
          correctPassword={PASSWORD} 
        />
      ) : (
        <div className={`your-existing-container-classes ${blurClassName}`}>
          {/* Your existing ImageGallery component content goes here */}
          {/* The hook will automatically protect all images */}
        </div>
      )}
    </>
  );
};

export default ImageGalleryWithProtection; 