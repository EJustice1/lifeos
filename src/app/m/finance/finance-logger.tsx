'use client'

import { useState, useTransition } from 'react'
import { logTransaction } from '@/lib/actions/finance'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { MobileInput } from '@/components/mobile/inputs/MobileInput'
import { MobileSelect } from '@/components/mobile/inputs/MobileSelect'
import { ToggleButton } from '@/components/mobile/buttons/ToggleButton'
import { useToast } from '@/components/mobile/feedback/ToastProvider'

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other']

interface Transaction {
  id: string
  type: string
  amount: number
  category: string
  description: string | null
  date: string
}

export function FinanceLogger({
  recentTransactions,
}: {
  recentTransactions: Transaction[]
}) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Salary')
  const [description, setDescription] = useState('')
  const [success, setSuccess] = useState(false)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const { showToast } = useToast()

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) return

    startTransition(async () => {
      try {
        await logTransaction(
          new Date().toISOString().split('T')[0],
          type,
          parseFloat(amount),
          category,
          description || undefined
        )
        setAmount('')
        setDescription('')
        showToast('Transaction logged successfully!', 'success')
      } catch (error) {
        showToast('Failed to log transaction', 'error')
      }
    })
  }

  return (
    <div className="space-y-4">
      <MobileCard>
        <ToggleButton
          options={[
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]}
          selectedValue={type}
          onChange={(value) => {
            setType(value as 'income' | 'expense')
            setCategory(value === 'income' ? 'Salary' : 'Food')
          }}
        />
      </MobileCard>

      <MobileCard>
        <MobileInput
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          prefix="$"
          className="text-center"
          inputClassName="text-4xl font-bold text-center"
        />
      </MobileCard>

      <MobileCard>
        <MobileSelect
          label="Category"
          options={categories.map((cat) => ({ value: cat, label: cat }))}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </MobileCard>

      <MobileCard>
        <MobileInput
          label="Note (optional)"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a note..."
        />
      </MobileCard>

      <PrimaryButton
        variant={type === 'income' ? 'primary' : 'danger'}
        size="lg"
        onClick={handleSubmit}
        disabled={isPending || !amount}
        loading={isPending}
      >
        {isPending ? 'Adding...' : 'Add Entry'}
      </PrimaryButton>

      {recentTransactions.length > 0 && (
        <MobileCard title="Recent Transactions">
          <div className="space-y-2">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span className="text-zinc-300">{t.category}</span>
                <span className={t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </MobileCard>
      )}
    </div>
  )
}
