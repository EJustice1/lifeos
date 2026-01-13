"use client";

import { useState, useEffect } from 'react';
import { MobileCard } from '@/components/mobile/cards/MobileCard';
import { NetWorthChart } from './charts/NetWorthChart';
import { AccountManagement } from './AccountManagement';
import { UnifiedTransactionForm } from './UnifiedTransactionForm';
import { ExpenseForm } from './ExpenseForm';
import { getNetWorth, getMonthlyStats, getAccounts } from '@/lib/actions/finance';
import { TimeRange } from '@/lib/types/finance';

export default function FinancePage() {
  const [activeSection, setActiveSection] = useState<'home' | 'transaction' | 'accounts' | 'expenses'>('home');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Summary data
  const [summaryData, setSummaryData] = useState({
    netWorth: 0,
    cashOnHand: 0,
    monthlyExpenses: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [netWorth, monthlyStats, allAccounts] = await Promise.all([
          getNetWorth(),
          getMonthlyStats(new Date().getFullYear(), new Date().getMonth() + 1),
          getAccounts(),
        ]);

        // Calculate cash on hand from cash/checking/savings accounts
        const cashAccounts = allAccounts?.filter(
          (account) => account.type === 'cash' || account.type === 'checking' || account.type === 'savings'
        ) || [];
        const cashTotal = cashAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);

        setSummaryData({
          netWorth: netWorth?.total || 0,
          cashOnHand: cashTotal,
          monthlyExpenses: monthlyStats?.expenses || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setSummaryData({
          netWorth: 0,
          cashOnHand: 0,
          monthlyExpenses: 0,
          isLoading: false,
        });
      }
    };

    fetchData();
  }, []);

  return (
    <section className="space-y-4">
      {activeSection === 'home' ? (
        /* Main screen with summary numbers and button grid */
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
          {/* Summary Numbers */}
          {summaryData.isLoading ? (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3].map((i) => (
                <MobileCard key={i} className="text-center py-4 animate-pulse">
                  <div className="h-4 bg-zinc-700 rounded mb-2"></div>
                  <div className="h-6 bg-zinc-700 rounded"></div>
                </MobileCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <MobileCard className="text-center py-4">
                <div className="text-xs text-zinc-400 mb-1">Net Worth</div>
                <div className="text-lg font-bold text-emerald-400">
                  ${(summaryData.netWorth / 1000).toFixed(1)}k
                </div>
              </MobileCard>

              <MobileCard className="text-center py-4">
                <div className="text-xs text-zinc-400 mb-1">Cash</div>
                <div className="text-lg font-bold text-blue-400">
                  ${(summaryData.cashOnHand / 1000).toFixed(1)}k
                </div>
              </MobileCard>

              <MobileCard className="text-center py-4">
                <div className="text-xs text-zinc-400 mb-1">Expenses</div>
                <div className="text-lg font-bold text-red-400">
                  ${(summaryData.monthlyExpenses / 1000).toFixed(1)}k
                </div>
              </MobileCard>
            </div>
          )}

          {/* Net Worth Chart */}
          <div className="mb-4">
            <NetWorthChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          </div>

          {/* Button Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveSection('expenses')}
              className="p-6 rounded-xl text-lg font-semibold bg-[var(--mobile-card-bg)] text-white hover:bg-zinc-800 transition-all"
            >
              Add Expense
            </button>

            <button
              onClick={() => setActiveSection('transaction')}
              className="p-6 rounded-xl text-lg font-semibold bg-[var(--mobile-card-bg)] text-white hover:bg-zinc-800 transition-all"
            >
              Transaction
            </button>

            <button
              onClick={() => setActiveSection('accounts')}
              className="p-6 rounded-xl text-lg font-semibold bg-[var(--mobile-card-bg)] text-white hover:bg-zinc-800 transition-all col-span-2"
            >
              Accounts
            </button>
          </div>
        </div>
      ) : activeSection === 'expenses' ? (
        /* Add Expense View */
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => setActiveSection('home')}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors mr-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold">Add Expense</h2>
          </div>
          <ExpenseForm onSuccess={() => setActiveSection('home')} />
        </div>
      ) : activeSection === 'transaction' ? (
        /* Add Transaction View */
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => setActiveSection('home')}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors mr-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold">Transaction</h2>
          </div>
          <UnifiedTransactionForm />
        </div>
      ) : activeSection === 'accounts' ? (
        /* Accounts View */
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => setActiveSection('home')}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors mr-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold">Accounts</h2>
          </div>
          <AccountManagement />
        </div>
      ) : null}
    </section>
  );
}
