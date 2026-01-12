"use client"

import { useState, useEffect, useCallback } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { processUnifiedTransaction } from '@/lib/actions/finance'
import { stockApiClient } from '@/lib/api/stock-api'
import { getAccounts } from '@/lib/actions/finance'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { MobileCard } from '@/components/mobile/cards/MobileCard'

interface Account {
  id: string
  name: string
  type: string
  balance: number
}

interface TransactionFormState {
  success?: boolean
  error?: string
  message?: string
}

const initialState: TransactionFormState = {}

export function UnifiedTransactionForm() {
  const [formState, setFormState] = useState<TransactionFormState>(initialState)
  const [step, setStep] = useState(1)
  const [transactionType, setTransactionType] = useState<'cash' | 'stock'>('cash')
  const [cashType, setCashType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [stockType, setStockType] = useState<'buy' | 'sell'>('buy')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [symbol, setSymbol] = useState('')
  const [price, setPrice] = useState<number | null>(null)
  const [shares, setShares] = useState<number | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)

  // Load accounts on component mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountData = await getAccounts()
        setAccounts(accountData)
        if (accountData.length > 0) {
          setSelectedAccount(accountData[0].id)
        }
      } catch (error) {
        console.error('Failed to load accounts')
        console.error('Error loading accounts:', error)
      }
    }

    loadAccounts()
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields based on transaction type
      if (transactionType === 'cash') {
        if (!amount || !selectedAccount) {
          throw new Error('Amount and account are required for cash transactions')
        }
      } else if (transactionType === 'stock') {
        if (!symbol || !price || !shares || !selectedAccount) {
          throw new Error('Symbol, price, shares, and account are required for stock transactions')
        }
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('transactionType', transactionType)
      formData.append('amount', amount?.toString() || '0')
      formData.append('symbol', symbol)
      formData.append('price', price?.toString() || '0')
      formData.append('shares', shares?.toString() || '0')
      formData.append('accountId', selectedAccount)
      formData.append('date', startDate)
      formData.append('isRecurring', isRecurring.toString())
      formData.append('frequency', frequency)
      formData.append('startDate', startDate)
      if (endDate) {
        formData.append('endDate', endDate)
      }
      if (description) {
        formData.append('description', description)
      }

      // Add transaction type specific fields
      if (transactionType === 'cash') {
        formData.append('cashType', cashType)
        formData.append('stockType', '')
      } else {
        formData.append('cashType', '')
        formData.append('stockType', stockType)
      }

      // Call server action
      const result = await processUnifiedTransaction(
        transactionType,
        transactionType === 'cash' ? cashType : null,
        transactionType === 'stock' ? stockType : null,
        amount || 0,
        symbol || null,
        price || null,
        shares || null,
        selectedAccount || null,
        startDate,
        isRecurring,
        frequency,
        startDate,
        endDate,
        description || null
      )

      if (result.success) {
        alert('Transaction processed successfully')
        resetForm()
        setStep(1)
      } else {
        throw new Error(result.message || 'Failed to process transaction')
      }
    } catch (error) {
      setFormState({ error: error instanceof Error ? error.message : 'Failed to process transaction' })
      console.error('Transaction error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [
    transactionType, cashType, stockType, amount, symbol, price, shares,
    selectedAccount, startDate, isRecurring, frequency, endDate, description
  ])

  const resetForm = () => {
    setTransactionType('cash')
    setCashType('deposit')
    setStockType('buy')
    setSymbol('')
    setPrice(null)
    setShares(null)
    setAmount(null)
    setIsRecurring(false)
    setFrequency('monthly')
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate(null)
    setDescription('')
  }

  const fetchStockPrice = useCallback(async () => {
    if (!symbol) return

    setIsFetchingPrice(true)
    try {
      const result = await stockApiClient.getStockPrice(symbol)
      setPrice(result.price)
      alert(`Fetched ${symbol} price: $${result.price}`)
    } catch (error) {
      alert(`Failed to fetch price for ${symbol}`)
      console.error('Stock price error:', error)
    } finally {
      setIsFetchingPrice(false)
    }
  }, [symbol])

  const { pending } = useFormStatus()

  return (
    <MobileCard className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Add Transaction</h3>
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-zinc-400 hover:text-zinc-200"
            disabled={isLoading}
          >
            Back
          </button>
        )}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setTransactionType('cash')
                setStep(2)
              }}
              className={`p-4 rounded-lg border-2 ${transactionType === 'cash' ? 'border-[var(--mobile-primary)] bg-[var(--mobile-primary)]/10' : 'border-zinc-700 hover:border-zinc-500'}`}
              disabled={isLoading}
            >
              <h4 className="font-medium mb-1">Cash</h4>
              <p className="text-sm text-zinc-400">Deposit or withdrawal</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTransactionType('stock')
                setStep(2)
              }}
              className={`p-4 rounded-lg border-2 ${transactionType === 'stock' ? 'border-[var(--mobile-primary)] bg-[var(--mobile-primary)]/10' : 'border-zinc-700 hover:border-zinc-500'}`}
              disabled={isLoading}
            >
              <h4 className="font-medium mb-1">Stock</h4>
              <p className="text-sm text-zinc-400">Buy or sell stocks</p>
            </button>
          </div>
        </div>
      )}

      {step === 2 && transactionType === 'cash' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCashType('deposit')}
              className={`p-3 rounded-lg ${cashType === 'deposit' ? 'bg-[var(--mobile-primary)] text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              disabled={isLoading}
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setCashType('withdrawal')}
              className={`p-3 rounded-lg ${cashType === 'withdrawal' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              disabled={isLoading}
            >
              Withdrawal
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                required
                disabled={isLoading}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (${account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Paycheck, Groceries"
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-[var(--mobile-primary)] bg-zinc-800 border-zinc-600 rounded focus:ring-[var(--mobile-primary)]"
                disabled={isLoading}
              />
              <label htmlFor="isRecurring" className="text-sm">
                Recurring transaction
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                    className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                    disabled={isLoading}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 p-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <PrimaryButton type="submit" className="flex-1" disabled={isLoading || pending}>
                {isLoading ? 'Processing...' : 'Submit Transaction'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {step === 2 && transactionType === 'stock' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStockType('buy')}
              className={`p-3 rounded-lg ${stockType === 'buy' ? 'bg-[var(--mobile-primary)] text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              disabled={isLoading}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setStockType('sell')}
              className={`p-3 rounded-lg ${stockType === 'sell' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              disabled={isLoading}
            >
              Sell
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Stock Symbol</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL, TSLA"
                  className="flex-1 p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={fetchStockPrice}
                  disabled={isFetchingPrice || !symbol || isLoading}
                  className={`p-3 ${isFetchingPrice ? 'bg-zinc-700' : 'bg-[var(--mobile-primary)] hover:bg-[var(--mobile-primary)]/90'} text-white rounded-lg transition-colors`}
                >
                  {isFetchingPrice ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : 'Get Price'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Current Price</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Shares</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={shares || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setShares(value)
                  if (price) {
                    setAmount(value * price)
                  }
                }}
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setAmount(value)
                  if (price && price > 0) {
                    setShares(value / price)
                  }
                }}
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                required
                disabled={isLoading}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (${account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Monthly investment, Portfolio rebalance"
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="stockIsRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-[var(--mobile-primary)] bg-zinc-800 border-zinc-600 rounded focus:ring-[var(--mobile-primary)]"
                disabled={isLoading}
              />
              <label htmlFor="stockIsRecurring" className="text-sm">
                Recurring transaction
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                    className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                    disabled={isLoading}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[var(--mobile-primary)] focus:outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 p-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <PrimaryButton type="submit" className="flex-1" disabled={isLoading || pending}>
                {isLoading ? 'Processing...' : 'Submit Transaction'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {formState.error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
          {formState.error}
        </div>
      )}
    </MobileCard>
  )
}