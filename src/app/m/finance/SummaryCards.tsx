"use client";

import { MobileCard } from '@/components/mobile/cards/MobileCard';
import { useEffect, useState } from 'react';
import { getNetWorth, getMonthlyStats } from '@/lib/actions/finance';

export function SummaryCards() {
  const [summaryData, setSummaryData] = useState({
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    portfolioValue: 0,
    isLoading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [netWorth, monthlyStats] = await Promise.all([
          getNetWorth(),
          getMonthlyStats(new Date().getFullYear(), new Date().getMonth() + 1)
        ]);

        setSummaryData({
          netWorth: netWorth?.total || 0,
          monthlyIncome: monthlyStats?.income || 0,
          monthlyExpenses: monthlyStats?.expenses || 0,
          portfolioValue: netWorth?.investments || 0,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setSummaryData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load financial summary',
        }));
      }
    };

    fetchData();
  }, []);

  if (summaryData.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <MobileCard key={i} className="text-center h-24">
            <div className="animate-pulse">
              <div className="text-sm text-zinc-400 bg-zinc-700 rounded h-4 mb-2"></div>
              <div className="text-2xl font-bold text-zinc-700 bg-zinc-700 rounded h-6 mb-1"></div>
              <div className="text-xs text-zinc-500 bg-zinc-700 rounded h-3"></div>
            </div>
          </MobileCard>
        ))}
      </div>
    );
  }

  if (summaryData.error) {
    return (
      <div className="text-red-500 text-center py-4">
        {summaryData.error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <MobileCard className="text-center">
        <div className="text-sm text-zinc-400">Net Worth</div>
        <div className="text-2xl font-bold text-emerald-400">
          ${summaryData.netWorth.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-500 mt-1">+2.5% this month</div>
      </MobileCard>

      <MobileCard className="text-center">
        <div className="text-sm text-zinc-400">Monthly Income</div>
        <div className="text-2xl font-bold text-blue-400">
          ${summaryData.monthlyIncome.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-500 mt-1">+10% vs last month</div>
      </MobileCard>

      <MobileCard className="text-center">
        <div className="text-sm text-zinc-400">Monthly Expenses</div>
        <div className="text-2xl font-bold text-red-400">
          ${summaryData.monthlyExpenses.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-500 mt-1">-5% vs last month</div>
      </MobileCard>

      <MobileCard className="text-center">
        <div className="text-sm text-zinc-400">Portfolio</div>
        <div className="text-2xl font-bold text-purple-400">
          ${summaryData.portfolioValue.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-500 mt-1">+8.2% this quarter</div>
      </MobileCard>
    </div>
  );
}