"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  actionButton?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  actionButton,
}) => {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between h-16 px-4 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
      </div>
      {actionButton && (
        <div className="flex items-center">
          {actionButton}
        </div>
      )}
    </header>
  );
};