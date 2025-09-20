import { useState } from 'react';
import type { ImageKitImage as Image } from '../../services/ImageKit';

interface UseModalReturn {
  selectedImage: Image | null;
  openModal: (image: Image) => void;
  closeModal: () => void;
  goToNextImage: (visibleImages: Image[]) => void;
  goToPrevImage: (visibleImages: Image[]) => void;
}

export const useModal = (): UseModalReturn => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const openModal = (image: Image) => setSelectedImage(image);
  const closeModal = () => setSelectedImage(null);
  
  const goToNextImage = (visibleImages: Image[]) => {
    if (!selectedImage) return;
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % visibleImages.length;
    setSelectedImage(visibleImages[nextIndex]);
  };

  const goToPrevImage = (visibleImages: Image[]) => {
    if (!selectedImage) return;
    const currentIndex = visibleImages.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
    setSelectedImage(visibleImages[prevIndex]);
  };

  return {
    selectedImage,
    openModal,
    closeModal,
    goToNextImage,
    goToPrevImage
  };
};