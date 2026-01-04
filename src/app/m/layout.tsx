"use client";

import { MobileNavigation, MobileHeader } from '@/components/mobile';
import { ToastProvider } from '@/components/mobile';
import { useSwipeNavigation } from '@/lib/hooks/use-swipe-gestures';
import { usePathname } from 'next/navigation';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const swipeRef = useSwipeNavigation(pathname);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <div className="flex-1 flex flex-col" ref={swipeRef}>
          <main className="container mx-auto px-0 py-0 max-w-md flex-1">
            {children}
          </main>
        </div>
        <MobileNavigation />
      </div>
    </ToastProvider>
  )
}
