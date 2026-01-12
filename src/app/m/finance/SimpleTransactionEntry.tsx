"use client";

import { useState } from 'react';
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton';
import { MobileCard } from '@/components/mobile/cards/MobileCard';
import { processUnifiedTransaction } from '@/lib/actions/finance';
import { useRouter } from 'next/navigation';

export function SimpleTransactionEntry() {
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'stock'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [symbol, setSymbol] = useState('AAPL');
  const [shares, setShares] = useState('1');
  const [price, setPrice] = useState('');
  const [accountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Common categories for quick selection
  const expenseCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];
  const incomeCategories = ['Salary', 'Bonus', 'Investment', 'Gift', 'Other'];

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (transactionType === 'expense' || transactionType === 'income') {
        // Cash transaction
        await processUnifiedTransaction(
          'cash',
          transactionType === 'income' ? 'deposit' : 'withdrawal',
          null,
          parseFloat(amount),
          null,
          null,
          null,
          accountId,
          today,
          false,
          null,
          today,
          null,
          description || `${transactionType === 'income' ? 'Income' : 'Expense'}: ${category} - $${amount}`
        );

        setSuccess(`✅ ${transactionType === 'income' ? 'Income' : 'Expense'} of $${amount} recorded successfully!`);
      } else if (transactionType === 'stock') {
        // Stock transaction
        await processUnifiedTransaction(
          'stock',
          null,
          price && shares ? 'buy' : null,
          parseFloat(amount),
          symbol,
          price ? parseFloat(price) : null,
          shares ? parseFloat(shares) : null,
          accountId,
          today,
          false,
          null,
          today,
          null,
          description || `Stock purchase: ${shares} shares of ${symbol}`
        );

        setSuccess(`✅ Stock purchase of ${shares} shares of ${symbol} recorded successfully!`);
      }

      // Reset form after successful submission
      setAmount('');
      setDescription('');
      setPrice('');
      setShares('1');

      // Refresh the page to show updated data
      router.refresh();

    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to record transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileCard>
      <h3 className="text-lg font-semibold mb-4">Quick Transaction Entry</h3>

      {/* Transaction Type Selection */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setTransactionType('expense')}
          className={`flex-1 p-2 rounded ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}
          disabled={isLoading}
        >
          💰 Expense
        </button>
        <button
          onClick={() => setTransactionType('income')}
          className={`flex-1 p-2 rounded ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}
          disabled={isLoading}
        >
          💵 Income
        </button>
        <button
          onClick={() => setTransactionType('stock')}
          className={`flex-1 p-2 rounded ${transactionType === 'stock' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}
          disabled={isLoading}
        >
          📈 Stock
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 pl-8 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)] text-right"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Transaction Type Specific Fields */}
      {(transactionType === 'expense' || transactionType === 'income') && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)]"
            disabled={isLoading}
          >
            {(transactionType === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {transactionType === 'stock' && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stock Symbol</label>
            <input
              type="text"
              placeholder="AAPL, TSLA, etc."
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full p-2 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)]"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shares</label>
            <input
              type="number"
              placeholder="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full p-2 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)]"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price per Share (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Auto-fetch if empty"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 pl-8 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)] text-right"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Description (optional)</label>
        <input
          type="text"
          placeholder={transactionType === 'expense' ? "Lunch at café" : transactionType === 'income' ? "Monthly salary" : "Stock purchase"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)]"
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <PrimaryButton
        variant="primary"
        size="lg"
        onClick={handleSubmit}
        disabled={isLoading || !amount || parseFloat(amount) <= 0}
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Record ${transactionType === 'expense' ? 'Expense' : transactionType === 'income' ? 'Income' : 'Stock Purchase'}`
        )}
      </PrimaryButton>

      {/* Status Messages */}
      {error && (
        <div className="mt-3 p-2 bg-red-900/50 rounded text-red-400 text-center text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 p-2 bg-green-900/50 rounded text-green-400 text-center text-sm">
          {success}
        </div>
      )}

      {/* Quick Examples */}
      <div className="mt-4 pt-3 border-t border-zinc-700">
        <p className="text-xs text-zinc-400 mb-2">Quick Examples:</p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setTransactionType('expense');
              setAmount('10');
              setCategory('Food');
              setDescription('Lunch');
            }}
            className="flex-1 p-2 bg-zinc-800 rounded text-xs text-zinc-300"
          >
            $10 Food
          </button>
          <button
            onClick={() => {
              setTransactionType('expense');
              setAmount('50');
              setCategory('Transportation');
              setDescription('Uber ride');
            }}
            className="flex-1 p-2 bg-zinc-800 rounded text-xs text-zinc-300"
          >
            $50 Uber
          </button>
          <button
            onClick={() => {
              setTransactionType('stock');
              setAmount('1000');
              setSymbol('AAPL');
              setShares('5');
              setDescription('Apple stock');
            }}
            className="flex-1 p-2 bg-zinc-800 rounded text-xs text-zinc-300"
          >
            Stock Buy
          </button>
        </div>
      </div>
    </MobileCard>
  );
}