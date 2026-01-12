"use client";

import { AppSidebar } from '@/components/mobile/layout/AppSidebar';
import { SimpleTransactionEntry } from '../SimpleTransactionEntry';
import { SummaryCards } from '../SummaryCards';
import { RecentActivity } from '../RecentActivity';

// Icon components for sidebar
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TransactionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const StockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
  </svg>
);

const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function QuickEntryPage() {
  const sidebarItems = [
    {
      icon: <HomeIcon />,
      label: 'Overview',
      href: '/m/finance',
      isActive: false
    },
    {
      icon: <TransactionIcon />,
      label: 'Quick Entry',
      href: '/m/finance/quick-entry',
      isActive: true
    },
    {
      icon: <StockIcon />,
      label: 'Investments',
      href: '/m/finance/investments',
      isActive: false
    },
    {
      icon: <BankIcon />,
      label: 'Accounts',
      href: '/m/finance/accounts',
      isActive: false
    },
    {
      icon: <ChartIcon />,
      label: 'Analytics',
      href: '/m/finance/analytics',
      isActive: false
    }
  ];

  return (
    <>
      <AppSidebar
        items={sidebarItems}
        title="Quick Entry"
        accentColor="var(--mobile-primary)"
      />

      <div className="pt-16 pb-8 px-4">
        <div className="space-y-4">
          <SummaryCards />
          <SimpleTransactionEntry />
          <RecentActivity />
        </div>
      </div>
    </>
  );
}