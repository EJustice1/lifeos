"use client";

import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton';
import { useState } from 'react';
import { SimpleTransactionEntry } from './SimpleTransactionEntry';

export function QuickActions() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  return (
    <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3">
        <PrimaryButton
          variant="primary"
          size="lg"
          onClick={() => setShowTransactionForm(!showTransactionForm)}
          className="w-full"
        >
          {showTransactionForm ? 'Cancel' : '💰 Quick Transaction'}
        </PrimaryButton>
      </div>

      {showTransactionForm && (
        <div className="mt-4">
          <SimpleTransactionEntry />
        </div>
      )}
    </div>
  );
}