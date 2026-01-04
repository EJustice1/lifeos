import React from 'react';

interface MobileCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)] ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      )}
      {children}
    </div>
  );
};