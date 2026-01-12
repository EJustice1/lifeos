"use client";

import { useState } from 'react';
import { NetWorthChart } from './charts/NetWorthChart';
import { DistributionChart } from './charts/DistributionChart';
import { AssetBreakdownChart } from './charts/AssetBreakdownChart';
import { AssetCompositionChart } from './charts/AssetCompositionChart';
import { SummaryCards } from './SummaryCards';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { UnifiedTransactionForm } from './UnifiedTransactionForm';
import { AccountManagement } from './AccountManagement';
import { TimeRange } from '@/lib/types/finance';

export function FinanceDashboard({ section }: { section: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  switch (section) {
    case 'overview':
      return (
        <div className="space-y-4">
          <SummaryCards />
          <QuickActions />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssetBreakdownChart />
            <AssetCompositionChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <NetWorthChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            <DistributionChart />
          </div>
          <RecentActivity />
        </div>
      );

    case 'transactions':
      return <div>Transactions Section (Coming Soon)</div>;

    case 'investments':
      return <div>Investments Section (Coming Soon)</div>;

    case 'accounts':
      return <AccountManagement />;

    case 'analytics':
      return <div>Analytics Section (Coming Soon)</div>;

    default:
      return <div>Overview Section</div>;
  }
}