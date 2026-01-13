"use client";

import { useState, useTransition } from 'react';
import { MobileCard } from '@/components/mobile/cards/MobileCard';
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton';
import { MobileSelect } from '@/components/mobile/inputs/MobileSelect';
import { useToast } from '@/components/mobile/feedback/ToastProvider';
import { logTransaction, createRecurringTransaction } from '@/lib/actions/finance';

const EXPENSE_CATEGORIES = [
  'Groceries',
  'Dining',
  'Transportation',
  'Utilities',
  'Rent/Mortgage',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Subscriptions',
  'Education',
  'Other',
];

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    startTransition(async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        if (isRecurring) {
          // Create recurring transaction
          await createRecurringTransaction(
            `${category} (Monthly)`,
            'expense',
            parseFloat(amount),
            category,
            'monthly',
            today,
            undefined, // no end date
            undefined, // no account
            `Recurring ${category} expense`
          );
          showToast('Recurring expense added successfully!', 'success');
        } else {
          // One-time transaction
          await logTransaction(
            today,
            'expense',
            parseFloat(amount),
            category,
            `${category} expense`,
            undefined
          );
          showToast('Expense added successfully!', 'success');
        }

        setAmount('');
        setIsRecurring(false);

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error adding expense:', error);
        showToast('Failed to add expense', 'error');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MobileCard>
        <label className="text-sm text-zinc-400 block mb-2">Category</label>
        <MobileSelect
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
        />
      </MobileCard>

      <MobileCard>
        <label className="text-sm text-zinc-400 block mb-2">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-2xl">$</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-zinc-800 rounded-lg p-4 pl-10 text-3xl font-bold text-center"
            disabled={isPending}
          />
        </div>
      </MobileCard>

      <MobileCard>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-base font-medium">Recurring Monthly</div>
            <div className="text-sm text-zinc-400">Repeat this expense every month</div>
          </div>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-6 h-6 rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-zinc-900"
            disabled={isPending}
          />
        </label>
      </MobileCard>

      <PrimaryButton
        type="submit"
        size="lg"
        variant="primary"
        className="w-full"
        disabled={isPending}
        loading={isPending}
      >
        {isPending ? 'Adding...' : 'Add Expense'}
      </PrimaryButton>
    </form>
  );
}
