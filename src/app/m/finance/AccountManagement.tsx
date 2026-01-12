"use client"

import { useState, useEffect } from 'react'
import { MobileCard } from '@/components/mobile/cards/MobileCard'
import { PrimaryButton } from '@/components/mobile/buttons/PrimaryButton'
import { getAccounts, updateAccountBalance } from '@/lib/actions/finance'
import { createAccount } from '@/lib/actions/finance'

export function AccountManagement() {
  const [accounts, setAccounts] = useState<Array<{
    id: string;
    name: string;
    type: 'cash' | 'checking' | 'savings' | 'investment' | 'crypto' | 'other';
    balance: number;
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'checking' as 'cash' | 'checking' | 'savings' | 'investment' | 'crypto' | 'other',
    balance: 0
  })
  const [editingAccount, setEditingAccount] = useState<{id: string, balance: number} | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAccounts()
      setAccounts(data)
    } catch (err) {
      console.error('Error fetching accounts:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAccount = async () => {
    try {
      setIsLoading(true)
      await createAccount(newAccount.name, newAccount.type, newAccount.balance)
      await fetchAccounts()
      setShowAddAccount(false)
      setNewAccount({ name: '', type: 'checking', balance: 0 })
    } catch (err) {
      console.error('Error creating account:', err)
      setError('Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBalance = async (accountId: string, newBalance: number) => {
    try {
      setIsLoading(true)
      // Calculate the difference to update
      const account = accounts.find(a => a.id === accountId)
      const difference = newBalance - account.balance

      await updateAccountBalance(accountId, difference)
      await fetchAccounts()
      setEditingAccount(null)
    } catch (err) {
      console.error('Error updating balance:', err)
      setError('Failed to update balance')
    } finally {
      setIsLoading(false)
    }
  }

  const accountTypeLabels = {
    cash: 'Cash',
    checking: 'Checking',
    savings: 'Savings',
    investment: 'Investment',
    crypto: 'Crypto',
    other: 'Other'
  }

  const accountColors = {
    cash: 'bg-green-500',
    checking: 'bg-blue-500',
    savings: 'bg-purple-500',
    investment: 'bg-indigo-500',
    crypto: 'bg-yellow-500',
    other: 'bg-gray-500'
  }

  if (isLoading && accounts.length === 0) {
    return (
      <MobileCard>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-zinc-700 rounded w-24"></div>
                    <div className="h-3 bg-zinc-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-zinc-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </MobileCard>
    )
  }

  if (error) {
    return (
      <MobileCard>
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      </MobileCard>
    )
  }

  return (
    <MobileCard>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Account Management</h3>
          <PrimaryButton
            variant="primary"
            size="sm"
            onClick={() => setShowAddAccount(!showAddAccount)}
          >
            {showAddAccount ? 'Cancel' : 'Add Account'}
          </PrimaryButton>
        </div>

        {showAddAccount && (
          <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg">
            <h4 className="font-medium">Add New Account</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Account Name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                className="w-full p-2 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)]"
              />
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount({...newAccount, type: e.target.value as 'cash' | 'checking' | 'savings' | 'investment' | 'crypto' | 'other'})}
                className="w-full p-2 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)]"
              >
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Initial Balance"
                value={newAccount.balance}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setNewAccount({...newAccount, balance: isNaN(value) ? 0 : value})
                }}
                className="w-full p-2 bg-zinc-700 rounded border border-zinc-600 focus:border-[var(--mobile-primary)]"
              />
              <PrimaryButton
                variant="primary"
                size="sm"
                onClick={handleAddAccount}
                disabled={!newAccount.name || isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Account'}
              </PrimaryButton>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div className="text-center text-zinc-400 py-8">
              <p>No accounts found</p>
              <p className="text-sm mt-2">Click "Add Account" to create your first account</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${accountColors[account.type as keyof typeof accountColors]}`}>
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">{account.name}</div>
                    <div className="text-xs text-zinc-400">
                      {accountTypeLabels[account.type as keyof typeof accountTypeLabels]} &bull; {account.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {editingAccount?.id === account.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={editingAccount?.balance || 0}
                        onChange={(e) => {
                          if (editingAccount) {
                            const value = parseFloat(e.target.value)
                            setEditingAccount({...editingAccount, balance: isNaN(value) ? 0 : value})
                          }
                        }}
                        className="w-24 p-1 bg-zinc-700 rounded text-right"
                      />
                      <button
                        onClick={() => editingAccount && handleUpdateBalance(account.id, editingAccount.balance)}
                        className="text-blue-400 hover:text-blue-300"
                        disabled={isLoading || !editingAccount}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingAccount(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-lg">
                        ${(isNaN(account.balance) || account.balance === null || account.balance === undefined ? 0 : account.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                      <button
                        onClick={() => setEditingAccount({id: account.id, balance: account.balance})}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {accounts.length > 0 && (
          <div className="text-xs text-zinc-500 pt-4">
            <p>Total Accounts: {accounts.length}</p>
            <p>Total Balance: ${accounts.reduce((sum, acc) => sum + (isNaN(acc.balance) || acc.balance === null || acc.balance === undefined ? 0 : acc.balance), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        )}
      </div>
    </MobileCard>
  )
}