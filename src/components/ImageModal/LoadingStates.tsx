import React from 'react';

interface LoadingStatesProps {
  loaded: boolean;
  placeholderLoaded: boolean;
  error: boolean;
}

export const LoadingStates: React.FC<LoadingStatesProps> = React.memo(({ loaded, placeholderLoaded, error }) => (
  <>
    {!loaded && !placeholderLoaded && !error && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    )}
    
    {error && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-red-900/80 text-white px-4 py-2 rounded-md">
          Failed to load image
        </div>
      </div>
    )}
  </>
));