// local image gallery
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Library, X } from 'lucide-react';
import ImageCard from './ImageCard';
import ImageGrid from './ImageGrid';
import { getAllImages, type Image as ImageType } from '../services/imageService';
import { AnimatePresence, motion } from 'framer-motion';

// Add isMobile detection utility
const isMobileDevice = () => {
  return (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) || 
         (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

// Enhanced configuration for hover effects
const HOVER_CONFIG = {
  MAX_TILT: 10, // Maximum rotation in degrees
  SCALE_FACTOR: 1.05, // How much to scale up on hover
  TRANSITION_SPEED: 0.3, // Transition speed in seconds
  PERSPECTIVE: 1000, // Perspective value for 3D effect
  SHADOW_COLOR: 'rgba(0,0,0,0.2)', // Shadow color
};

const MAX_VISIBLE_INDICATORS = 8; // Maximum number of indicators to show
const PRELOAD_IMAGES = 3; // Preload nearby images
const SWIPE_THRESHOLD = 10; // Minimal finger movement to trigger swipe
const VELOCITY_THRESHOLD = 0.02; // Detect even the slightest flick
const SWIPE_RESISTANCE = 0.2; // Almost no resistance for immediate movement
const MAX_ROTATION_ANGLE = 8; // Slightly reduced rotation for faster perception
const SPRING_ANIMATION_DURATION = 100; // Ultra-fast spring reset
const SWIPE_EXIT_DURATION = 100; // Ultra-fast exit animation
const NEXT_CARD_VISIBILITY_THRESHOLD = 0.1; // Show next card after just 10% of swipe progress

// Add new modal-related constants
const MODAL_DRAG_THRESHOLD = 100; // Pixels needed to dismiss modal via drag
const MODAL_DRAG_VELOCITY_THRESHOLD = 0.5; // Velocity needed to dismiss modal

const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<number | null>(null);
  const [visibleImageIndices, setVisibleImageIndices] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [preloadedSrc, setPreloadedSrc] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState<ImageType | null>(null);
  const [modalDragY, setModalDragY] = useState(0);
  const [isModalDragging, setIsModalDragging] = useState(false);
  const [modalDragVelocity, setModalDragVelocity] = useState(0);
  const prevIndexRef = useRef(currentIndex);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const lastTouchRef = useRef<{x: number, y: number} | null>(null);
  const velocityXRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const imagesLoaded = useRef(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const screenWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);
  const swipeDirectionRef = useRef<'left' | 'right' | null>(null);

  // Add modal-related refs
  const modalTouchStartRef = useRef<{x: number, y: number} | null>(null);
  const modalTouchTimeRef = useRef<number | null>(null);
  const lastModalTouchRef = useRef<{x: number, y: number} | null>(null);
  const modalAnimFrameRef = useRef<number | null>(null);

  // Add new states for tilt effect
  const [isMobile, setIsMobile] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Use memo to prevent unnecessary re-renders of image data
  const getImages = useCallback(async () => {
    try {
      const allImages = getAllImages();
      setImages(allImages);
      imagesLoaded.current = true;
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }, []);

  useEffect(() => {
    getImages();
    
    // Set screen width on mount and on resize
    const handleResize = () => {
      screenWidthRef.current = window.innerWidth;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getImages]);

  // Calculate which images should be visible based on current index
  useEffect(() => {
    if (images.length === 0) return;
    
    // Priority: current image + immediately adjacent ones
    const highPriorityIndices = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length
    ];
    
    // Secondary: other preload images
    const secondaryIndices = [];
    for (let i = 2; i <= PRELOAD_IMAGES; i++) {
      const prevIndex = (currentIndex - i + images.length) % images.length;
      const nextIndex = (currentIndex + i) % images.length;
      secondaryIndices.push(prevIndex, nextIndex);
    }
    
    setVisibleImageIndices([...highPriorityIndices, ...secondaryIndices]);
  }, [currentIndex, images.length]);

  const handleScroll = useCallback(() => {
    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
    }

    const scrollPosition = window.scrollY;
    if (scrollPosition > 100) {
      const timeout = window.setTimeout(() => {
        setHideTimeout(null);
      }, 4000);
      setHideTimeout(timeout);
    } else {
      setHideTimeout(null);
    }
  }, [hideTimeout]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [handleScroll, hideTimeout]);

  // Make transitions almost instant
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100); // Ultra-fast transition (was 200ms)
      
      prevIndexRef.current = currentIndex;
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  // Clean up any animations when component unmounts
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Preload images function
  const preloadImage = useCallback((src: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }, []);

  // Preload current and adjacent images when they change
  useEffect(() => {
    if (images.length === 0 || visibleImageIndices.length === 0) return;
    
    // Preload visible images
    const preloadPromises = visibleImageIndices.slice(0, 3).map(index => 
      preloadImage(images[index].src)
    );
    
    Promise.all(preloadPromises).catch(() => {
      // Silently handle any preloading errors
    });
  }, [visibleImageIndices, images, preloadImage]);

  // Preload the active image whenever it changes
  useEffect(() => {
    if (images.length === 0) return;
    
    // Force preload the current image
    const currentImageSrc = images[currentIndex].src;
    setPreloadedSrc(currentImageSrc);
    
    const preloader = new Image();
    preloader.src = currentImageSrc;
    
    // Also preload adjacent images in the background
    const preloadAdjacent = () => {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      const nextIndex = (currentIndex + 1) % images.length;
      
      const prevImage = new Image();
      prevImage.src = images[prevIndex].src;
      
      const nextImage = new Image();
      nextImage.src = images[nextIndex].src;
    };
    
    // Preload after a small delay
    const timer = setTimeout(preloadAdjacent, 200);
    
    return () => clearTimeout(timer);
  }, [currentIndex, images]);

  const prevImage = () => {
    if (isTransitioning) return; // Prevent rapid clicking
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    if (isTransitioning) return; // Prevent rapid clicking
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Improved random image function
  const randomImage = () => {
    // Prevent clicking if already transitioning or loading
    if (isTransitioning || shuffleLoading) return;
    
    // Set loading state to show spinner
    setShuffleLoading(true);
    
    // Clear any existing preloaded image
    setPreloadedSrc(null);
    
    // Find a new random index
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * images.length);
    } while (newIndex === currentIndex && images.length > 1);
    
    // Store the new image source
    const newImageSrc = images[newIndex].src;
    
    // Force the browser to load the image before proceeding
    const imgLoader = new Image();
    
    // After the image is loaded, update the state
    imgLoader.onload = () => {
      // Mark that the image is preloaded and store its source
      setPreloadedSrc(newImageSrc);
      
      // Update visible indices for adjacent images
      const adjacentIndices = [
        newIndex,
        (newIndex + 1) % images.length,
        (newIndex - 1 + images.length) % images.length
      ];
      setVisibleImageIndices(adjacentIndices);
      
      // Update with requestAnimationFrame for smoother transitions
      requestAnimationFrame(() => {
        // Start the transition animation 
        setIsTransitioning(true);
        
        // Wait again to ensure the animation is applied
        requestAnimationFrame(() => {
          // Update the current index to show the new image
          setCurrentIndex(newIndex);
          
          // Clear the loading state
          setShuffleLoading(false);
        });
      });
    };
    
    // If image fails to load, still try to show it
    imgLoader.onerror = () => {
      console.warn('Failed to preload image, attempting to show anyway');
      
      setIsTransitioning(true);
      setCurrentIndex(newIndex); 
      setShuffleLoading(false);
    };
    
    // Start loading the image
    imgLoader.src = newImageSrc;
  };

  // Lightning-fast touch handling
  const onTouchStart = (e: React.TouchEvent) => {
    // Prevent handling touch if we're in a transition
    if (isTransitioning) return;
    
    // Cancel any ongoing animation
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    const touch = e.targetTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = performance.now();
    velocityXRef.current = 0;
    setDragStartY(touch.clientY);
    setDragY(0);
    setIsDragging(true);
    setDragOffset(0);
    setSwipeDirection(null);
    setSwipeProgress(0);
    swipeDirectionRef.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) return;
    
    // Extract touch data directly
    const touch = e.targetTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    
    // Always prevent default for maximum responsiveness
    e.preventDefault();
    
    // Instant velocity calculation with maximum weight on current movement
    if (lastTouchRef.current !== null) {
      const timeDelta = performance.now() - (touchStartTimeRef.current || performance.now());
      if (timeDelta > 0) {
        const instantVelocityX = (touch.clientX - lastTouchRef.current.x) / timeDelta;
        // 90% weight on current movement for instantaneous response
        velocityXRef.current = velocityXRef.current * 0.1 + instantVelocityX * 0.9;
      }
    }
    
    // Update last position
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Minimal resistance for immediate card movement
    const resistedDeltaX = deltaX * SWIPE_RESISTANCE;
    
    // Set direction immediately
    const direction = deltaX < 0 ? 'left' : 'right';
    if (swipeDirectionRef.current !== direction) {
      swipeDirectionRef.current = direction;
      setSwipeDirection(direction);
    }
    
    // Require very little movement to reach full swipe progress
    const progress = Math.min(Math.abs(deltaX) / (screenWidthRef.current * 0.1), 1);
    setSwipeProgress(progress);
    
    // Direct DOM-like updates for zero-lag response
    setDragOffset(resistedDeltaX);
    setDragY(0);
    
    // Auto-complete swipe if we pass 70% progress
    if (progress > 0.7 && !isTransitioning) {
      animateSwipeCompletion(direction);
    }
  };

  // Instant swipe completion animation
  const animateSwipeCompletion = (direction: 'left' | 'right') => {
    // Stop any further dragging during the completion
    setIsDragging(false);
    
    const startOffset = dragOffset;
    const targetOffset = direction === 'left' ? -screenWidthRef.current * 0.6 : screenWidthRef.current * 0.6;
    const startTime = performance.now();
    const duration = SWIPE_EXIT_DURATION;
    
    // Precompute next index for faster updates
    const nextIndex = direction === 'left' 
      ? (currentIndex + 1) % images.length 
      : (currentIndex - 1 + images.length) % images.length;
    
    // Ultra-fast animation
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simple linear animation for maximum speed perception
      setSwipeProgress(progress);
      setDragOffset(startOffset + (targetOffset - startOffset) * progress);
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Complete immediately
        setDragOffset(0);
        setDragY(0);
        setSwipeProgress(0);
        setSwipeDirection(null);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
        
        // Change the image immediately
        setCurrentIndex(nextIndex);
      }
    };
    
    // Start animation immediately
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  // Reset with minimal animation
  const animateSpringReset = () => {
    const startOffset = dragOffset;
    const startTime = performance.now();
    const duration = SPRING_ANIMATION_DURATION;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simple quadratic ease-out for speed
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      
      // Batch state updates
      setDragOffset(startOffset * (1 - easedProgress));
      setSwipeProgress(swipeProgress * (1 - easedProgress));
      
      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Reset everything immediately
        setDragOffset(0);
        setDragY(0);
        setSwipeProgress(0);
        setSwipeDirection(null);
        swipeDirectionRef.current = null;
        animationFrameIdRef.current = null;
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  // Hyper-responsive touch end handler
  const onTouchEnd = () => {
    if (!isDragging || touchStartRef.current === null || isTransitioning) {
      setIsDragging(false);
      return;
    }
    
    const touchEnd = lastTouchRef.current;
    if (!touchEnd) {
      setIsDragging(false);
      return;
    }
    
    const deltaX = touchEnd.x - touchStartRef.current.x;
    
    // Consider almost any movement as a swipe
    const velocity = Math.abs(velocityXRef.current);
    const isQuickSwipe = velocity > VELOCITY_THRESHOLD;
    
    // Require almost no movement for a swipe
    const effectiveThreshold = isQuickSwipe ? 1 : SWIPE_THRESHOLD;
    
    setIsDragging(false);
    
    // Complete swipe with almost no threshold
    if (Math.abs(deltaX) >= effectiveThreshold || isQuickSwipe) {
      animateSwipeCompletion(deltaX < 0 ? 'left' : 'right');
    } else {
      animateSpringReset();
    }
    
    // Reset tracking
    touchStartRef.current = null;
    lastTouchRef.current = null;
    touchStartTimeRef.current = null;
    velocityXRef.current = 0;
  };

  // For keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGrid) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGrid, isTransitioning]);

  // Calculate visible indicators
  const visibleIndicators = React.useMemo(() => {
    if (images.length <= MAX_VISIBLE_INDICATORS) {
      return images.map((_, i) => i);
    }

    const halfCount = Math.floor(MAX_VISIBLE_INDICATORS / 2);
    let startIndex = currentIndex - halfCount;
    let endIndex = currentIndex + halfCount;

    // Adjust if we're near the beginning
    if (startIndex < 0) {
      endIndex -= startIndex; // Add the overflow to end
      startIndex = 0;
    }

    // Adjust if we're near the end
    if (endIndex >= images.length) {
      startIndex = Math.max(0, startIndex - (endIndex - images.length + 1));
      endIndex = images.length - 1;
    }

    // Make sure we don't exceed our desired count
    if (endIndex - startIndex + 1 > MAX_VISIBLE_INDICATORS) {
      endIndex = startIndex + MAX_VISIBLE_INDICATORS - 1;
    }

    return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i);
  }, [currentIndex, images.length]);

  // High-performance transform style for active card
  const getActiveCardTransform = () => {
    if (!isDragging || dragOffset === 0) return '';
    
    // Calculate rotation proportionally to swipe distance
    const rotationFactor = Math.min(Math.abs(dragOffset) / (screenWidthRef.current * 0.3), 1);
    const rotationAngle = MAX_ROTATION_ANGLE * rotationFactor * (dragOffset > 0 ? 1 : -1);
    
    // Apply hardware acceleration with translateZ for better performance
    return `translate3d(${dragOffset}px, 0, 0) rotate(${rotationAngle}deg)`;
  };

  // Improved adjacent card transform with earlier appearance
  const getAdjacentCardTransform = (index: number) => {
    if (!swipeDirection || swipeProgress === 0) return '';
    
    const isNext = (swipeDirection === 'left' && index === (currentIndex + 1) % images.length) ||
                 (swipeDirection === 'right' && index === (currentIndex - 1 + images.length) % images.length);
    
    if (isNext) {
      // Start with larger initial scale for better visibility
      const scale = 0.9 + (0.1 * swipeProgress);
      
      // More pronounced movement for next card
      const xOffset = swipeDirection === 'left' ? 
        25 - (25 * swipeProgress) : // Coming from right
        -25 + (25 * swipeProgress); // Coming from left
      
      // Add slight shadow/depth for better visual hierarchy
      return `translate3d(${xOffset}px, 0, 0) scale(${scale})`;
    }
    
    return '';
  };

  // Add new function to open modal
  const openImageModal = (image: ImageType) => {
    setModalImage(image);
    setShowModal(true);
    setModalDragY(0);
    setIsModalDragging(false);
    setModalDragVelocity(0);
  };

  // Add new function to close modal
  const closeImageModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setModalImage(null);
    }, 300); // Clear after animation completes
  };

  // Add modal touch handlers
  const onModalTouchStart = (e: React.TouchEvent) => {
    if (modalAnimFrameRef.current) {
      cancelAnimationFrame(modalAnimFrameRef.current);
      modalAnimFrameRef.current = null;
    }
    
    const touch = e.touches[0];
    modalTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
    lastModalTouchRef.current = { x: touch.clientX, y: touch.clientY };
    modalTouchTimeRef.current = performance.now();
    setIsModalDragging(true);
  };

  const onModalTouchMove = (e: React.TouchEvent) => {
    if (!isModalDragging || !modalTouchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - modalTouchStartRef.current.y;
    
    // Only allow downward dragging (deltaY > 0)
    if (deltaY < 0) {
      setModalDragY(0);
      return;
    }
    
    // Track velocity for momentum-based dismissal
    if (lastModalTouchRef.current) {
      const timeDelta = performance.now() - (modalTouchTimeRef.current || performance.now());
      if (timeDelta > 0) {
        const instantVelocityY = (touch.clientY - lastModalTouchRef.current.y) / timeDelta;
        setModalDragVelocity(instantVelocityY);
      }
    }
    
    // Update reference
    lastModalTouchRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Calculate resistance to make it harder to drag as you pull down
    const resistedDeltaY = Math.min(deltaY * 0.5, screenWidthRef.current * 0.3);
    setModalDragY(resistedDeltaY);
    
    // Add opacity based on drag distance
    const opacity = Math.max(1 - (resistedDeltaY / 400), 0.3);
    
    // If user drags far enough, dismiss modal
    if (resistedDeltaY > MODAL_DRAG_THRESHOLD) {
      closeImageModal();
      setIsModalDragging(false);
    }
  };

  const onModalTouchEnd = () => {
    if (!isModalDragging) return;
    
    // If velocity is high enough, dismiss modal
    if (modalDragVelocity > MODAL_DRAG_VELOCITY_THRESHOLD) {
      closeImageModal();
    } else if (modalDragY > 0) {
      // Animate back to center with spring effect
      const startY = modalDragY;
      const startTime = performance.now();
      const duration = 300;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Spring-like easing
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        const newY = startY * (1 - easedProgress);
        
        setModalDragY(newY);
        
        if (progress < 1) {
          modalAnimFrameRef.current = requestAnimationFrame(animate);
        } else {
          setModalDragY(0);
          modalAnimFrameRef.current = null;
        }
      };
      
      modalAnimFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Reset state
    setIsModalDragging(false);
    modalTouchStartRef.current = null;
    lastModalTouchRef.current = null;
    modalTouchTimeRef.current = null;
  };

  // Add mouse handlers for non-touch devices
  const onModalMouseDown = (e: React.MouseEvent) => {
    modalTouchStartRef.current = { x: e.clientX, y: e.clientY };
    lastModalTouchRef.current = { x: e.clientX, y: e.clientY };
    modalTouchTimeRef.current = performance.now();
    setIsModalDragging(true);
    
    // Add document-level handlers that will be removed on mouse up
    document.addEventListener('mousemove', onModalMouseMove);
    document.addEventListener('mouseup', onModalMouseUp);
  };

  const onModalMouseMove = (e: MouseEvent) => {
    if (!isModalDragging || !modalTouchStartRef.current) return;
    
    const deltaY = e.clientY - modalTouchStartRef.current.y;
    
    // Only allow downward dragging
    if (deltaY < 0) {
      setModalDragY(0);
      return;
    }
    
    // Track velocity for momentum-based dismissal
    if (lastModalTouchRef.current && modalTouchTimeRef.current) {
      const timeDelta = performance.now() - modalTouchTimeRef.current;
      if (timeDelta > 0) {
        const instantVelocityY = (e.clientY - lastModalTouchRef.current.y) / timeDelta;
        setModalDragVelocity(instantVelocityY);
      }
    }
    
    // Update reference
    lastModalTouchRef.current = { x: e.clientX, y: e.clientY };
    
    // Apply resistance
    const resistedDeltaY = Math.min(deltaY * 0.5, screenWidthRef.current * 0.3);
    setModalDragY(resistedDeltaY);
    
    // If user drags far enough, dismiss modal
    if (resistedDeltaY > MODAL_DRAG_THRESHOLD) {
      closeImageModal();
      setIsModalDragging(false);
      
      // Clean up document listeners
      document.removeEventListener('mousemove', onModalMouseMove);
      document.removeEventListener('mouseup', onModalMouseUp);
    }
  };

  const onModalMouseUp = () => {
    // Same logic as touch end
    if (!isModalDragging) return;
    
    if (modalDragVelocity > MODAL_DRAG_VELOCITY_THRESHOLD) {
      closeImageModal();
    } else if (modalDragY > 0) {
      // Animate back to center
      const startY = modalDragY;
      const startTime = performance.now();
      const duration = 300;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Spring-like easing
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        const newY = startY * (1 - easedProgress);
        
        setModalDragY(newY);
        
        if (progress < 1) {
          modalAnimFrameRef.current = requestAnimationFrame(animate);
        } else {
          setModalDragY(0);
          modalAnimFrameRef.current = null;
        }
      };
      
      modalAnimFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Reset state
    setIsModalDragging(false);
    modalTouchStartRef.current = null;
    lastModalTouchRef.current = null;
    
    // Clean up document listeners
    document.removeEventListener('mousemove', onModalMouseMove);
    document.removeEventListener('mouseup', onModalMouseUp);
  };

  // Cleanup function for modal animations
  useEffect(() => {
    return () => {
      if (modalAnimFrameRef.current) {
        cancelAnimationFrame(modalAnimFrameRef.current);
      }
      document.removeEventListener('mousemove', onModalMouseMove);
      document.removeEventListener('mouseup', onModalMouseUp);
    };
  }, []);

  // Check if device is mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Add mouse position tracking function
  const handleMouseMove = (e: React.MouseEvent, cardId: string) => {
    if (isMobile) return;
    
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Calculate position relative to the center of the image
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    
    setMousePosition({ x, y });
    setHoveredCardId(cardId);
  };

  // Reset position when mouse leaves
  const handleMouseLeave = () => {
    setHoveredCardId(null);
  };

  // Render the ImageCard with clickable behavior
  const renderImageCard = (index: number, style: React.CSSProperties) => {
    const image = images[index];
    // Calculate tilt transform for the card
    const tiltStyle: React.CSSProperties = {};
    
    if (hoveredCardId === image.id && !isMobile) {
      // Only apply tilt if this card is hovered and not on mobile
      const MAX_TILT = HOVER_CONFIG.MAX_TILT;
      
      // Calculate rotation based on mouse position
      const rotateY = mousePosition.x * MAX_TILT;
      const rotateX = -mousePosition.y * MAX_TILT; // Invert Y axis for natural feel
      
      // Enhance style with tilt effect
      tiltStyle.transform = `perspective(${HOVER_CONFIG.PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${HOVER_CONFIG.SCALE_FACTOR})`;
      tiltStyle.transition = hoveredCardId ? `transform 0.05s linear` : `transform ${HOVER_CONFIG.TRANSITION_SPEED}s ease-out`;
      tiltStyle.willChange = 'transform';
      tiltStyle.boxShadow = `0 20px 30px -10px ${HOVER_CONFIG.SHADOW_COLOR}`;
      tiltStyle.zIndex = 40; // Raise above other cards
    } else {
      // Add gentle transition for when mouse leaves
      tiltStyle.transition = `transform ${HOVER_CONFIG.TRANSITION_SPEED}s ease-out, box-shadow ${HOVER_CONFIG.TRANSITION_SPEED}s ease-out`;
      tiltStyle.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
      tiltStyle.boxShadow = '0 10px 30px -15px rgba(0,0,0,0)';
    }
    
    return (
      <div 
        key={image.id}
        style={{
          ...style,
          ...tiltStyle
        }}
        className="transition-transform duration-200 ease-out hover:z-50"
        onClick={() => openImageModal(image)}
        onMouseMove={(e) => handleMouseMove(e, image.id)}
        onMouseLeave={handleMouseLeave}
      >
        <ImageCard 
          key={image.id}
          image={image}
          index={index}
          activeIndex={currentIndex}
          totalImages={images.length}
          isPreloaded={preloadedSrc === image.src}
        />
      </div>
    );
  };

  if (showGrid) {
    return <ImageGrid images={images} onClose={() => setShowGrid(false)} />;
  }

  return (
    <div 
      ref={galleryRef}
      className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 overflow-hidden"
    >
      <div 
        className={`w-full h-full relative ${isTransitioning ? 'pointer-events-none' : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative h-full w-full flex items-center justify-center">
          <button 
            className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 shadow-xl hover:scale-110"
            onClick={prevImage}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-7 h-7 md:w-10 md:h-10" />
          </button>
          
          <button 
            className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 shadow-xl hover:scale-110"
            onClick={nextImage}
            aria-label="Next image"
          >
            <ChevronRight className="w-7 h-7 md:w-10 md:h-10" />
          </button>
          
          <div className="relative w-full h-[85vh] md:h-[95vh] flex items-center justify-center">
            {visibleImageIndices.map(index => {
              const isActive = index === currentIndex;
              const isAdjacent = Math.abs(index - currentIndex) === 1 ||
                                (currentIndex === 0 && index === images.length - 1) ||
                                (currentIndex === images.length - 1 && index === 0);
              
              // Higher z-index for active and adjacent cards
              const zIndex = isActive ? 30 : (isAdjacent ? 25 : 10);
              
              // More visible adjacent cards - show them even with minimal swipe
              const isNextCard = (swipeDirection === 'left' && index === (currentIndex + 1) % images.length) ||
                                (swipeDirection === 'right' && index === (currentIndex - 1 + images.length) % images.length);
              
              // Show adjacent cards as soon as there's minimal swipe movement
              const shouldShowAdjacent = swipeProgress > NEXT_CARD_VISIBILITY_THRESHOLD && isNextCard;
              
              // Determine transform style based on card state
              const cardStyle: React.CSSProperties = {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translateX(0)',
                willChange: (isDragging && isActive) || shouldShowAdjacent ? 'transform' : 'auto',
                zIndex,
                // More dramatic opacity change for next card
                opacity: isActive ? 1 : (shouldShowAdjacent ? 
                          0.6 + (swipeProgress * 0.4) : (isAdjacent ? 0.5 : 0.3)),
                cursor: 'pointer' // Add pointer cursor
              };
              
              // Apply transforms based on card state
              if (isActive) {
                if (isDragging) {
                  cardStyle.transform = getActiveCardTransform();
                }
              } else if (isDragging && isNextCard) {
                // Always calculate adjacent transform if dragging
                const adjacentTransform = getAdjacentCardTransform(index);
                if (adjacentTransform) {
                  cardStyle.transform = adjacentTransform;
                }
              }
              
              return renderImageCard(index, cardStyle);
            })}
          </div>
        </div>
        
        {/* Fixed bottom navigation bar */}
        <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-40">
          <div className="flex justify-center gap-4">
            <button 
              onClick={randomImage}
              disabled={shuffleLoading}
              className={`p-3 rounded-full ${
                shuffleLoading 
                  ? 'bg-black/30 text-gray-400' 
                  : 'bg-black/40 hover:bg-black/60 text-white'
              } backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg`}
              aria-label="Random image"
            >
              {shuffleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Shuffle className="w-5 h-5" />
              )}
            </button>
            
            <button 
              onClick={() => setShowGrid(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-300 hover:scale-105 shadow-lg"
              aria-label="View library"
            >
              <Library className="w-5 h-5" />
              <span className="font-medium">Library</span>
            </button>
          </div>
          
          <div className="flex space-x-2 md:space-x-3 overflow-hidden px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
            {visibleIndicators.map(index => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  currentIndex === index 
                    ? 'bg-white w-8 h-2 md:h-3' 
                    : 'bg-white/40 hover:bg-white/70 w-2 h-2 md:h-3 md:w-3'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showModal && modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            onClick={closeImageModal}
          >
            {/* Blurred backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-12px" />
            
            {/* Modal content */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ 
                scale: 1, 
                y: modalDragY,
                opacity: modalDragY > 0 ? Math.max(1 - (modalDragY / 400), 0.3) : 1
              }}
              exit={{ scale: 0.9, y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] max-h-[90vh] overflow-hidden rounded-xl"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onModalTouchStart}
              onTouchMove={onModalTouchMove}
              onTouchEnd={onModalTouchEnd}
              onMouseDown={onModalMouseDown}
            >
              {/* Close button */}
              <button
                className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:bg-black/70 transition-all duration-200"
                onClick={closeImageModal}
                aria-label="Close image"
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Image */}
              <div className="relative shadow-3xl rounded-3xl overflow-hidden bg-black select-none modal-image-container transition-transform duration-300 will-change-transform">
                <img
                  src={modalImage.src}
                  alt={modalImage.title}
                  className="object-contain max-h-[90vh] w-auto"
                  draggable={false}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add tilt effect to the modal image as well */}
      {showModal && modalImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          onClick={closeImageModal}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-12px" />
          
          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ 
              scale: 1, 
              y: modalDragY,
              opacity: modalDragY > 0 ? Math.max(1 - (modalDragY / 400), 0.3) : 1
            }}
            exit={{ scale: 0.9, y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] max-h-[90vh] overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onModalTouchStart}
            onTouchMove={onModalTouchMove}
            onTouchEnd={onModalTouchEnd}
            onMouseDown={onModalMouseDown}
          >
            {/* Close button */}
            <button
              className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:bg-black/70 transition-all duration-200"
              onClick={closeImageModal}
              aria-label="Close image"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image */}
            <div className="relative shadow-3xl rounded-3xl overflow-hidden bg-black select-none modal-image-container transition-transform duration-300 will-change-transform">
              <img
                src={modalImage.src}
                alt={modalImage.title}
                className="object-contain max-h-[90vh] w-auto"
                draggable={false}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageGallery;