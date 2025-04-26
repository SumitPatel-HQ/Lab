# Image Protection Hook

This repository contains custom React hooks that provide lightweight security measures for protecting images on your website.

## Features

- Disable right-click/save on images
- Prevent drag-and-drop of images
- Block DevTools shortcuts (F12, Ctrl+Shift+I, etc.)
- Detect tab switch/blur and ask for password again
- Blur screen on suspicious activity

## Installation

The hook is already integrated into the application. No additional installation is required.

## Usage

### Basic Usage in App.tsx

The security protection is already implemented in the main `App.tsx` file:

```tsx
import useSecurityProtection from './hooks/useSecurityProtection';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Use the security protection hook
  const { isBlurred, unblur, blurClassName } = useSecurityProtection({
    onSuspiciousActivity: () => setIsAuthenticated(false),
  });
  
  const handleAuthentication = () => {
    setIsAuthenticated(true);
    unblur(); // Clear any blur when authentication succeeds
  };

  return (
    <div className={`your-classes ${isBlurred ? blurClassName : ''}`}>
      {!isAuthenticated ? (
        <PasswordProtection 
          onAuthenticated={handleAuthentication} 
          correctPassword={PASSWORD} 
        />
      ) : (
        <YourComponent />
      )}
    </div>
  );
}
```

### Using in Custom Components

To add protection to any component:

1. Import the hook:
   ```tsx
   import useSecurityProtection from '../hooks/useSecurityProtection';
   ```

2. Use the hook in your component:
   ```tsx
   const { isBlurred, unblur, blurClassName } = useSecurityProtection({
     onSuspiciousActivity: () => {
       // Handle suspicious activity (e.g., show password prompt)
     }
   });
   ```

3. Apply the blur class to your container:
   ```tsx
   <div className={`your-existing-classes ${blurClassName}`}>
     {/* Your component content */}
   </div>
   ```

### Example with Password Protection

For a component that requires password re-authentication on suspicious activity:

```tsx
import React, { useState } from 'react';
import useSecurityProtection from '../hooks/useSecurityProtection';
import PasswordProtection from '../components/PasswordProtection';

const ProtectedComponent = () => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const PASSWORD = "your_password";
  
  const { isBlurred, unblur, blurClassName } = useSecurityProtection({
    onSuspiciousActivity: () => setShowPasswordPrompt(true)
  });
  
  const handleAuthentication = () => {
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
        <div className={`your-container-classes ${blurClassName}`}>
          {/* Your protected content */}
        </div>
      )}
    </>
  );
};
```

## Customization

The hook's behavior can be customized by modifying the `useSecurityProtection.tsx` file:

- Change CSS rules for image protection
- Adjust blur intensity and animation
- Modify detection thresholds for DevTools
- Add additional security measures

## Limitations

- These measures provide basic protection but cannot prevent all methods of copying images
- Advanced users may bypass these protections
- Some protection methods might interfere with legitimate user interactions

## Examples

Check out these examples:
- `src/examples/ImageGalleryWithProtection.tsx` - Example of integrating with an image gallery