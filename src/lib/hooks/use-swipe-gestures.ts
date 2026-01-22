"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SwipeOptions {
  minSwipeDistance?: number;
  minSwipeVelocity?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useSwipeGestures = (
  elementRef: React.RefObject<HTMLElement>,
  options: SwipeOptions = {}
) => {
  const {
    minSwipeDistance = 50,
    minSwipeVelocity = 0.3,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartRef.current.x;
      const deltaY = touchEndY - touchStartRef.current.y;
      const deltaTime = touchEndTime - touchStartRef.current.time;

      // Calculate velocity (pixels per millisecond)
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine if it's a valid swipe
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

      // Check if swipe meets minimum distance and velocity requirements
      if (isHorizontalSwipe && Math.abs(deltaX) > minSwipeDistance && velocityX > minSwipeVelocity) {
        if (deltaX > 0 && onSwipeRight) {
          // Right swipe
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          // Left swipe
          onSwipeLeft();
        }
      } else if (isVerticalSwipe && Math.abs(deltaY) > minSwipeDistance && velocityY > minSwipeVelocity) {
        if (deltaY > 0 && onSwipeDown) {
          // Down swipe
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          // Up swipe
          onSwipeUp();
        }
      }

      // Reset touch start position
      touchStartRef.current = null;
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, minSwipeDistance, minSwipeVelocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
};

// Navigation routes for swipe gestures
const NAV_ROUTES = [
  '/m/gym',
  '/m/study',
  '/m/daily-review',
];

export const useSwipeNavigation = (currentPath: string) => {
  const router = useRouter();
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Find current route index
  const currentIndex = NAV_ROUTES.indexOf(currentPath);

  useSwipeGestures(elementRef as React.RefObject<HTMLElement>, {
    onSwipeLeft: () => {
      if (currentIndex < NAV_ROUTES.length - 1) {
        router.push(NAV_ROUTES[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        router.push(NAV_ROUTES[currentIndex - 1]);
      }
    },
  });

  return elementRef;
};