import { SessionProvider } from './_components/SessionProvider';
import { ToastProvider } from '@/components/mobile';

export const metadata = {
  title: 'LifeOS Mobile',
  description: 'Personal data analytics platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LifeOS',
  },
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ToastProvider>
        <div className="min-h-screen bg-zinc-950 text-white">
          <main className="container mx-auto px-0 py-0 max-w-md min-h-screen">
            {children}
          </main>
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
