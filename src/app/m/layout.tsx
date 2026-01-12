"use client";

import { ToastProvider } from '@/components/mobile';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-950 text-white">
        <main className="container mx-auto px-0 py-0 max-w-md min-h-screen">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
