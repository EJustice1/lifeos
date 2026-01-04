"use client";

import React from 'react';
import { triggerHapticFeedback } from '@/lib/utils/haptic-feedback';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Variant styling
  const variantClasses = {
    primary: 'bg-[var(--mobile-primary)] hover:bg-[var(--mobile-primary)]/90 focus:ring-[var(--mobile-primary)]/80',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 focus:ring-[var(--mobile-secondary)]/80',
    danger: 'bg-[var(--mobile-danger)] hover:bg-[var(--mobile-danger)]/90 focus:ring-[var(--mobile-danger)]/80',
  };

  // Size styling
  const sizeClasses = {
    sm: 'px-[var(--mobile-button-padding-sm)] text-sm',
    md: 'px-[var(--mobile-button-padding-md)] text-base',
    lg: 'px-[var(--mobile-button-padding-lg)] text-lg',
  };

  // Base classes
  const baseClasses = 'rounded-[var(--mobile-border-radius)] font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-[var(--mobile-primary)]/80';

  // Haptic feedback for mobile devices
  const handleClickWithHaptic = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      triggerHapticFeedback();
      props.onClick(e);
    }
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={handleClickWithHaptic}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      aria-label={loading ? `Loading ${children}` : undefined}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};