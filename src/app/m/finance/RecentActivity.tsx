"use client";

import { MobileCard } from '@/components/mobile/cards/MobileCard';
import { useEffect, useState } from 'react';
import { getRecentTransactions } from '@/lib/actions/finance';

export function RecentActivity() {
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    description: string;
    date: string;
    category: string;
    type: 'income' | 'expense';
    amount: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getRecentTransactions(5);
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching recent transactions:', err);
        setError('Failed to load recent transactions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <MobileCard>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 animate-pulse">
              <div className="flex-1">
                <div className="font-medium text-white bg-zinc-700 rounded h-4 mb-1"></div>
                <div className="text-xs text-zinc-400 bg-zinc-700 rounded h-3"></div>
              </div>
              <div className="font-bold text-zinc-700 bg-zinc-700 rounded h-4 w-16"></div>
            </div>
          ))}
        </div>
      </MobileCard>
    );
  }

  if (error) {
    return (
      <MobileCard>
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      </MobileCard>
    );
  }

  return (
    <MobileCard>
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
            <div className="flex-1">
              <div className="font-medium text-white">{transaction.description}</div>
              <div className="text-xs text-zinc-400">
                {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
              </div>
            </div>
            <div className={`font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </MobileCard>
  );
}