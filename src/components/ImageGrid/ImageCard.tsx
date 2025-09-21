import React from 'react';
import { ImageSkeleton } from '../loading-placeholders';
import HoverAnimation from './animations/HoverAnimation';
import type { ImageKitImage as Image } from '../../services/ImageKit';

interface ImageCardProps {
  image: Image;
  layoutMode: 'grid' | 'masonry';
  onImageClick: (image: Image) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, layoutMode, onImageClick }) => {
  return (
    <HoverAnimation
      imageUrl={image.src}
      title={image.title}
      layoutMode={layoutMode}
      onImageClick={() => onImageClick(image)}
    >
      <ImageSkeleton 
        image={image}
        aspectRatio={image.ratio as '2:3' | '3:2'}
        quality="preview"
        className={layoutMode === 'masonry' ? 'w-full' : ''}
      />
    </HoverAnimation>
  );
};

export default ImageCard;