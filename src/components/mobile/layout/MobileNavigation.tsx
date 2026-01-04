"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  // Add keyboard navigation support
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const links = Array.from(navElement.querySelectorAll('a')) as HTMLAnchorElement[];
        const currentIndex = links.findIndex(link => link.getAttribute('aria-current') === 'page');

        if (currentIndex !== -1) {
          let nextIndex = currentIndex;
          if (e.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % links.length;
          } else if (e.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + links.length) % links.length;
          }

          links[nextIndex].focus();
          e.preventDefault();
        }
      }
    };

    navElement.addEventListener('keydown', handleKeyDown);
    return () => {
      navElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      href: '/m/finance',
      label: 'Finance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M12 6h.01M6 12h.01M18 12h.01" />
        </svg>
      ),
    },
    {
      href: '/m/gym',
      label: 'Gym',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      href: '/m/study',
      label: 'Study',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l3 3 3-3" />
        </svg>
      ),
    },
    {
      href: '/m/daily-review',
      label: 'Review',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-40" aria-label="Main navigation">
      <div className="flex justify-around items-center h-16" ref={navRef} role="tablist">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--mobile-primary)] focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                isActive ? 'text-[var(--mobile-primary)]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              role="tab"
              tabIndex={isActive ? 0 : -1}
            >
              <span className="text-xs mb-1">{item.label}</span>
              <span className={`transition-colors duration-200 ${
                isActive ? 'text-[var(--mobile-primary)]' : 'text-zinc-400'
              }`}>
                {item.icon}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};