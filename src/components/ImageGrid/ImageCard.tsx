import React from 'react';
import { ImageSkeleton } from '../loading-placeholders';
import type { ImageKitImage as Image } from '../../services/ImageKit';

interface ImageCardProps {
  image: Image;
  layoutMode: 'grid' | 'masonry';
  onImageClick: (image: Image) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, layoutMode, onImageClick }) => {
  return (
    <div
      className={`${layoutMode === 'masonry' ? 'mb-4 break-inside-avoid' : ''} group relative cursor-pointer`}
      onClick={() => onImageClick(image)}
    >
      <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
        <ImageSkeleton 
          image={image}
          aspectRatio={image.ratio as '2:3' | '3:2'}
          quality="preview"
          className={layoutMode === 'masonry' ? 'w-full' : ''}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white text-sm font-medium">{image.title}</h3>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;