import { useState, useEffect, useCallback } from 'react';

interface UseSliderControlReturn {
  isDraggingSlider: boolean;
  handleSliderStart: () => void;
  updateSliderPosition: (clientX: number, sliderElement: HTMLDivElement, onGridDensityChange: (density: number) => void) => void;
}

export const useSliderControl = (): UseSliderControlReturn => {
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const handleSliderStart = useCallback(() => {
    setIsDraggingSlider(true);
  }, []);

  const updateSliderPosition = useCallback((
    clientX: number, 
    sliderElement: HTMLDivElement, 
    onGridDensityChange: (density: number) => void
  ) => {
    const rect = sliderElement.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1);
    const newDensity = Math.round(percentage * 4) + 1;
    onGridDensityChange(newDensity);
  }, []);

  // Handle mouse events
  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSlider(false);
    
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return {
    isDraggingSlider,
    handleSliderStart,
    updateSliderPosition
  };
};