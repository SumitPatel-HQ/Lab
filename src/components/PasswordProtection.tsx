// change the password in App.tsx
import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PasswordProtectionProps {
  onAuthenticated: () => void;
  correctPassword: string;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ 
  onAuthenticated,
  correctPassword = '2000' // Default password, can be overridden by props
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
  // Add visibility change detection to expire authentication when tab/window changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If the page becomes hidden (user switches tabs or minimizes)
      if (document.visibilityState === 'hidden') {
        setAuthenticated(false);
      }
    };
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up a session storage event listener to ensure authentication state is consistent
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session_expired' && e.newValue === 'true') {
        setAuthenticated(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === correctPassword) {
      setAuthenticated(true);
      setError(false);
      // No longer storing in localStorage
      onAuthenticated();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };
  
  if (authenticated) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center">
      <div className={`bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${shake ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Protected Gallery</h1>
          <p className="text-gray-300 text-center mb-6">Enter password to access the image gallery</p>
          
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full px-4 py-3 rounded-lg bg-gray-800/80 text-white border ${error ? 'border-red-500' : 'border-gray-700'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Enter password"
                autoFocus
              />
              {error && (
                <p className="text-red-500 mt-2">Incorrect password. Please try again.</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors duration-300"
            >
              Unlock Gallery
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordProtection; 