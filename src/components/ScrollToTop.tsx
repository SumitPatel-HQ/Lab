import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopProps {
  showAfter?: number;
  smooth?: boolean;
  className?: string;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  showAfter = 300, 
  smooth = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Check scroll position and toggle visibility
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [showAfter]);

  // Scroll to top function
  const scrollToTop = () => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 shadow-xl hover:scale-110 transform animate-fade-in ${className}`}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-7 h-7 md:w-10 md:h-10" />
    </button>
  );
};

export default ScrollToTop;