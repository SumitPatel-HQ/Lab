import React, { useEffect, useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Library, X } from 'lucide-react';
import ImageCard from '../components/ImageCard';
import ImageGrid from '../components/ImageGrid';
import ImageModal from '../components/ImageModal';
import { getAllImages, type Image as ImageType } from '../services/imageService';
import { AnimatePresence, motion } from 'framer-motion';
import PasswordProtection from '../components/PasswordProtection';
import useSecurityProtection from '../hooks/useSecurityProtection';

/**
 * Example of how to integrate the security protection hook with ImageGallery
 * 
 * HOW TO USE THIS IN YOUR EXISTING ImageGallery.tsx:
 * 
 * 1. Add the import for the hook:
 *    import useSecurityProtection from '../hooks/useSecurityProtection';
 * 
 * 2. Add these states inside your component:
 *    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
 *    const { isBlurred, unblur, blurClassName } = useSecurityProtection({
 *      onSuspiciousActivity: () => setShowPasswordPrompt(true),
 *    });
 * 
 * 3. Add this handler:
 *    const handleAuthentication = () => {
 *      setShowPasswordPrompt(false);
 *      unblur();
 *    };
 * 
 * 4. Wrap your root JSX with conditional rendering:
 *    return (
 *      <>
 *        {showPasswordPrompt ? (
 *          <PasswordProtection 
 *            onAuthenticated={handleAuthentication} 
 *            correctPassword="YOUR_PASSWORD" 
 *          />
 *        ) : (
 *          <div className={`your-existing-classes ${blurClassName}`}>
 *            {/* Your existing JSX */}
 *          </div>
 *        )}
 *      </>
 *    );
 */

const ImageGalleryWithProtection: React.FC = () => {
  // Example simplified implementation to demonstrate integration
  const [images, setImages] = useState<ImageType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState<ImageType | null>(null);
  
  // Add security protection
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const PASSWORD = "2000"; // Example password
  
  const { isBlurred, unblur, blurClassName } = useSecurityProtection({
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

  // Load images (simplified from original)
  useEffect(() => {
    try {
      const allImages = getAllImages();
      setImages(allImages);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }, []);
  
  const nextImage = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const toggleGrid = () => {
    setShowGrid(prev => !prev);
  };
  
  const openImageModal = (image: ImageType) => {
    setModalImage(image);
    setShowModal(true);
  };
  
  const closeImageModal = () => {
    setShowModal(false);
    setModalImage(null);
  };
  
  // Apply security protection to the component
  return (
    <>
      {showPasswordPrompt ? (
        <PasswordProtection 
          onAuthenticated={handleAuthentication} 
          correctPassword={PASSWORD} 
        />
      ) : (
        <div className={`min-h-screen bg-gray-900 dark:bg-gray-900 ${blurClassName}`}>
          {/* Navigation buttons */}
          <div className="fixed top-0 left-0 right-0 z-10 flex justify-between p-4">
            <button 
              onClick={toggleGrid}
              className="p-2 text-white bg-black/30 rounded-full"
            >
              <Library size={24} />
            </button>
            <button 
              onClick={nextImage}
              className="p-2 text-white bg-black/30 rounded-full"
            >
              <Shuffle size={24} />
            </button>
          </div>
          
          {/* Main image display */}
          <div className="relative flex items-center justify-center min-h-screen">
            {images.length > 0 && !showGrid && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 p-3 text-white bg-black/30 rounded-full z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <div 
                  className="w-full h-full flex justify-center items-center"
                  onClick={() => openImageModal(images[currentIndex])}
                >
                  <img 
                    src={images[currentIndex].src} 
                    alt={`Gallery image ${currentIndex + 1}`}
                    className="max-h-screen max-w-full object-contain"
                  />
                </div>
                
                <button 
                  onClick={nextImage}
                  className="absolute right-4 p-3 text-white bg-black/30 rounded-full z-10"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            
            {/* Grid view */}
            {showGrid && (
              <div className="w-full min-h-screen p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div 
                      key={image.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        setShowGrid(false);
                      }}
                      className="cursor-pointer"
                    >
                      <img 
                        src={image.src} 
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Modal */}
          {showModal && modalImage && (
            <div 
              className="fixed top-0 left-0 w-full h-full z-50 bg-black/90 flex items-center justify-center"
              onClick={closeImageModal}
            >
              <button 
                className="absolute top-4 right-4 p-2 text-white bg-black/50 rounded-full"
                onClick={closeImageModal}
              >
                <X size={24} />
              </button>
              <img 
                src={modalImage.src} 
                alt="Modal view"
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGalleryWithProtection; 