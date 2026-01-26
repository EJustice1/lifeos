import React from 'react';
import { triggerHapticFeedback } from '@/lib/utils/haptic-feedback';

interface AdjustButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const AdjustButton: React.FC<AdjustButtonProps> = ({
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-title-md',
    md: 'w-16 h-16 text-headline-md',
    lg: 'w-20 h-20 text-headline-lg',
  };

  const handleClickWithHaptic = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHapticFeedback();
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <button
      className={`bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-[var(--mobile-border-radius)] font-bold transition-colors flex items-center justify-center ${sizeClasses[size]} ${className}`}
      onClick={handleClickWithHaptic}
      {...props}
    >
      {children}
    </button>
  );
};