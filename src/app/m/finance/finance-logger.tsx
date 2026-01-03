'use client'

import { useState, useTransition } from 'react'
import { logTransaction } from '@/lib/actions/finance'

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

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) return

    startTransition(async () => {
      await logTransaction(
        new Date().toISOString().split('T')[0],
        type,
        parseFloat(amount),
        category,
        description || undefined
      )
      setAmount('')
      setDescription('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    })
  }

  return (
    <section className="space-y-4">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2 bg-zinc-900 rounded-xl p-1">
        <button
          onClick={() => {
            setType('income')
            setCategory('Salary')
          }}
          className={`rounded-lg py-3 font-semibold transition-colors ${
            type === 'income' ? 'bg-emerald-600' : 'text-zinc-400'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => {
            setType('expense')
            setCategory('Food')
          }}
          className={`rounded-lg py-3 font-semibold transition-colors ${
            type === 'expense' ? 'bg-red-600' : 'text-zinc-400'
          }`}
        >
          Expense
        </button>
      </div>

      {/* Amount input */}
      <div className="bg-zinc-900 rounded-xl p-6 text-center">
        <label className="text-sm text-zinc-400 block mb-2">Amount</label>
        <div className="flex items-center justify-center gap-1">
          <span className="text-3xl text-zinc-500">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-4xl font-bold text-center w-40"
          />
        </div>
      </div>

      {/* Category */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <label className="text-sm text-zinc-400 block mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-zinc-800 rounded-lg p-3"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div className="bg-zinc-900 rounded-xl p-4">
        <label className="text-sm text-zinc-400 block mb-2">Note (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a note..."
          className="w-full bg-zinc-800 rounded-lg p-3"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !amount}
        className={`w-full rounded-xl p-4 text-lg font-semibold transition-colors ${
          success
            ? 'bg-emerald-500'
            : type === 'income'
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : 'bg-red-600 hover:bg-red-500'
        } disabled:opacity-50`}
      >
        {isPending ? 'Adding...' : success ? 'Added!' : 'Add Entry'}
      </button>

      {/* Recent transactions */}
      {recentTransactions.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm text-zinc-400 mb-3">Recent</h3>
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
        </div>
      )}
    </section>
  )
}
