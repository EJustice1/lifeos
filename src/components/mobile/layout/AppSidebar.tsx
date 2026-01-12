"use client";

import React, { useState, useEffect } from 'react';
import { triggerHapticFeedback } from '@/lib/utils/haptic-feedback';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

interface AppSidebarProps {
  items: SidebarItem[];
  title: string;
  accentColor?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  items,
  title,
  accentColor = 'var(--mobile-primary)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  // Swipe detection for sidebar
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0].clientX < 20) { // Within 20px of left edge
        setIsSwiping(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isSwiping && e.touches[0].clientX > 50) {
        setIsOpen(true);
        setIsSwiping(false);
        triggerHapticFeedback();
      }
    };

    const handleTouchEnd = () => {
      setIsSwiping(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSwiping]);

  return (
    <>
      {/* Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-zinc-900 z-40 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>

        <nav className="p-2 space-y-1">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                triggerHapticFeedback();
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${item.isActive ? `bg-[${accentColor}]/20 text-[${accentColor}]` : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
            >
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Hamburger menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
};