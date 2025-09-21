// Optimized ImageKit-powered image gallery
import React from 'react';
import ImageGrid from '../ImageGrid';
import { useGalleryState } from './state';
import { LoadingState } from './Loading';
import { MainGalleryView } from './Main';

const Gallery: React.FC = () => {
  const galleryState = useGalleryState();

  // Loading state - only show full loading screen if we have no images and are loading
  if (galleryState.loading && galleryState.images.length === 0) {
    return <LoadingState />;
  }

  // Grid view
  if (galleryState.showGrid) {
    return <ImageGrid images={galleryState.images} onClose={() => galleryState.setShowGrid(false)} />;
  }

  // Main gallery view
  return <MainGalleryView {...galleryState} />;
};

export default Gallery;
