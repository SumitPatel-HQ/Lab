// Animation Summary: Configurable Smooth Ease-In/Ease-Out Transitions
// This file documents all the smooth animations implemented in HoverAnimation.tsx
// All animations now use HOVER_CONFIG for consistent timing and behavior

// Configuration moved to useHoverAnimation.ts to avoid conflicts
// Use: import { HOVER_CONFIG } from './useHoverAnimation';

export const SMOOTH_ANIMATIONS = {
  // Primary card transform animations (all based on HOVER_CONFIG.TRANSITION_SPEED)
  MOUSE_MOVE: {
    duration: 'TRANSITION_SPEED * 0.2', // Fast response
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth ease-in-out
    properties: ['transform', 'box-shadow']
  },
  
  MOUSE_ENTER: {
    duration: 'TRANSITION_SPEED * 0.3', // Quick smooth entry
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
    properties: ['transform', 'box-shadow']
  },
  
  MOUSE_LEAVE: {
    duration: 'TRANSITION_SPEED * 1.0', // Full duration for smooth exit
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth elastic ease-out
    properties: ['transform', 'box-shadow']
  },

  // Overlay animations
  GRADIENT_OVERLAY: {
    duration: 'TRANSITION_SPEED * 0.7',
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    properties: ['opacity']
  },

  // Title animations
  TITLE_CONTAINER: {
    duration: 'TRANSITION_SPEED * 0.6',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth elastic
    properties: ['transform', 'opacity']
  },
  
  TITLE_TEXT: {
    duration: 'TRANSITION_SPEED * 0.4',
    delay: 'TRANSITION_SPEED * 0.1', // Staggered for natural feel
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    properties: ['opacity']
  },

  // Container base transition
  CONTAINER_BASE: {
    duration: 'TRANSITION_SPEED * 0.4',
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    properties: ['all']
  }
} as const;

// Easing functions explained:
// - cubic-bezier(0.25, 0.46, 0.45, 0.94) = "ease-in-out" - smooth and natural
// - cubic-bezier(0.16, 1, 0.3, 1) = "ease-out-back" - elastic bounce effect
// - ease-out = built-in smooth deceleration